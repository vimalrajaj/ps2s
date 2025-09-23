const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const router = express.Router();

// Multer setup - accept only image files
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, JPEG) are allowed'), false);
    }
  }
});

// Initialize the route with dependencies
function initCertificateRoutes() {

  // Certificate verification page route
  router.get("/certificate_verification", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "certificate_verification", "public", "index.html"));
  });

  // Browser automation for full certificate verification
  async function verifyWithBrowserAutomation(certificateUrl) {
    console.log('🎭 Starting browser automation for:', certificateUrl);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set a realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set viewport
      await page.setViewport({ width: 1280, height: 720 });
      
      // Navigate to the certificate URL with timeout
      console.log('📡 Navigating to URL...');
      const response = await page.goto(certificateUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Wait for content to load
      await page.waitForTimeout(3000);
      
      // Try to find certificate-related content
      const certificateContent = await page.evaluate(() => {
        // Common selectors for certificate content
        const selectors = [
          'h1', 'h2', 'h3',
          '.certificate-title', '.cert-title',
          '.name', '.recipient-name',
          '.course', '.program',
          '.issuer', '.organization',
          '.date', '.issue-date',
          '[class*="certificate"]',
          '[class*="cert"]',
          '[id*="certificate"]',
          '[id*="cert"]'
        ];

        const content = {};
        
        // Extract text from various elements
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              content[selector] = Array.from(elements).map(el => el.textContent.trim()).filter(text => text.length > 0);
            }
          } catch (e) {
            // Ignore errors for individual selectors
          }
        });

        // Get page title
        content.title = document.title;
        
        // Try to find any verification status
        const verificationKeywords = ['verified', 'valid', 'authentic', 'issued', 'certified'];
        content.verificationIndicators = [];
        
        verificationKeywords.forEach(keyword => {
          const regex = new RegExp(keyword, 'gi');
          if (document.body.textContent.match(regex)) {
            content.verificationIndicators.push(keyword);
          }
        });

        return content;
      });

      console.log('🔍 Extracted content:', certificateContent);

      // Determine if certificate appears valid based on content
      const isValid = certificateContent.verificationIndicators.length > 0 || 
                     certificateContent.title.toLowerCase().includes('certificate') ||
                     Object.values(certificateContent).some(arr => 
                       Array.isArray(arr) && arr.some(text => 
                         text.toLowerCase().includes('certificate') || 
                         text.toLowerCase().includes('certified')
                       )
                     );

      await browser.close();

      return {
        status: isValid ? 'Valid' : 'Unknown',
        verificationMethod: 'Browser Automation',
        content: certificateContent,
        url: certificateUrl
      };

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      console.error('🚫 Browser automation failed:', error.message);
      throw error;
    }
  }

  // Function to verify certificate online by scraping the certificate URL
  async function verifyCertificateOnline(certificateUrl) {
    console.log('🌐 Attempting online verification for:', certificateUrl);
    
    try {
      // First try simple HTTP request
      const response = await axios.get(certificateUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      const $ = cheerio.load(response.data);
      const pageTitle = $('title').text();
      const bodyText = $('body').text().toLowerCase();
      
      console.log('📄 Page title:', pageTitle);
      
      // Check for verification indicators
      const verificationKeywords = ['verified', 'valid', 'authentic', 'issued', 'certified', 'certificate'];
      const foundKeywords = verificationKeywords.filter(keyword => 
        bodyText.includes(keyword) || pageTitle.toLowerCase().includes(keyword)
      );

      console.log('🔍 Found verification keywords:', foundKeywords);

      // Extract certificate details
      const certificateDetails = {
        title: pageTitle,
        recipientName: '',
        courseName: '',
        issuer: '',
        issueDate: '',
        verificationStatus: foundKeywords.length > 0 ? 'Valid' : 'Unknown'
      };

      // Try to extract recipient name
      const nameSelectors = ['.name', '.recipient-name', '.student-name', '[class*="name"]'];
      for (const selector of nameSelectors) {
        const nameElement = $(selector).first();
        if (nameElement.length && nameElement.text().trim()) {
          certificateDetails.recipientName = nameElement.text().trim();
          break;
        }
      }

      // Try to extract course/program name
      const courseSelectors = ['.course', '.program', '.certification', '[class*="course"]', '[class*="program"]'];
      for (const selector of courseSelectors) {
        const courseElement = $(selector).first();
        if (courseElement.length && courseElement.text().trim()) {
          certificateDetails.courseName = courseElement.text().trim();
          break;
        }
      }

      // Try to extract issuer
      const issuerSelectors = ['.issuer', '.organization', '.company', '[class*="issuer"]', '[class*="org"]'];
      for (const selector of issuerSelectors) {
        const issuerElement = $(selector).first();
        if (issuerElement.length && issuerElement.text().trim()) {
          certificateDetails.issuer = issuerElement.text().trim();
          break;
        }
      }

      return {
        status: certificateDetails.verificationStatus,
        verificationMethod: 'Online Scraping',
        details: certificateDetails,
        url: certificateUrl
      };

    } catch (error) {
      console.error('🚫 Online verification failed, trying browser automation...', error.message);
      
      // If simple scraping fails, try browser automation as fallback
      try {
        return await verifyWithBrowserAutomation(certificateUrl);
      } catch (browserError) {
        console.error('🚫 Browser automation also failed:', browserError.message);
        throw new Error(`Verification failed: ${error.message}. Browser automation also failed: ${browserError.message}`);
      }
    }
  }

  // Function to extract URLs from OCR text
  function extractUrlFromText(text) {
    console.log('🔗 Extracting URL from text...');
    
    // Multiple URL patterns to catch different formats
    const urlPatterns = [
      // Standard URLs
      /https?:\/\/[^\s\n\r\t]+/gi,
      // URLs without protocol
      /(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.(?:[a-zA-Z]{2,})(?:\/[^\s\n\r\t]*)?/gi,
      // Specific certificate platforms
      /(?:credly\.com|coursera\.org|edx\.org|udemy\.com|linkedin\.com\/learning|skillshare\.com|udacity\.com|codecademy\.com|freecodecamp\.org|khanacademy\.org|pluralsight\.com|treehouse\.com|adobe\.com|microsoft\.com|google\.com|amazon\.com|ibm\.com|oracle\.com|salesforce\.com|unstop\.com)[^\s\n\r\t]*/gi
    ];

    let urls = [];
    
    urlPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        urls = urls.concat(matches);
      }
    });

    // Remove duplicates and clean URLs
    urls = [...new Set(urls)]
      .map(url => {
        // Clean the URL
        url = url.trim();
        // Add protocol if missing
        if (url && !url.match(/^https?:\/\//i)) {
          url = 'https://' + url;
        }
        return url;
      })
      .filter(url => {
        // Basic validation
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

    console.log('🔗 Extracted URLs:', urls);
    return urls.length > 0 ? urls[0] : null; // Return first valid URL
  }

  // Function to perform OCR on image
  async function performOCR(imagePath) {
    console.log('👁️ Starting OCR process...');
    
    try {
      const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      console.log('👁️ OCR completed. Extracted text length:', text.length);
      return text;
    } catch (error) {
      console.error('👁️ OCR failed:', error);
      throw new Error('OCR processing failed: ' + error.message);
    }
  }

  // Main certificate verification route
  router.post('/verify', upload.single('certificate'), async (req, res) => {
    const userName = req.body.name;
    const filePath = req.file ? req.file.path : null;

    console.log('Received request to /verify');
    console.log('Uploaded file path:', filePath);
    console.log('User-provided name:', userName);

    // Helper function to safely send response
    const safeResponse = (data) => {
      console.log('📤 Sending response:', JSON.stringify(data, null, 2));
      if (!res.headersSent && res.writable) {
        res.json(data);
      } else {
        console.warn('⚠️ Cannot send response - headers already sent or response not writable');
      }
    };

    // Check if file is uploaded
    if (!req.file) {
      console.error('File upload failed: req.file is undefined');
      return res.status(400).json({ status: 'Invalid', reason: 'File upload failed' });
    }

    console.log('File uploaded successfully:', req.file);

    try {
      let certificateData = null;
      
      console.log('Step 1: Attempting QR code detection...');
      
      // First, try to find QR code
      try {
        const img = await Jimp.read(filePath);
        console.log('Image successfully read. Attempting QR code detection...');

        // Enhanced QR code detection optimized for small QR codes
        let qrData = null;
        let attempts = 0;
        const maxQrAttempts = 12; // Increased attempts for better small QR detection

        while (!qrData && attempts < maxQrAttempts) {
          attempts++;
          console.log(`QR detection attempt ${attempts}/${maxQrAttempts}`);
          
          try {
            let processedImg = img.clone();
            
            switch(attempts) {
              case 1:
                console.log('Trying original image...');
                break;
              case 2:
                console.log('Trying high contrast...');
                processedImg.contrast(0.5).brightness(0.1);
                break;
              case 3:
                console.log('Trying grayscale with high contrast...');
                processedImg.greyscale().contrast(0.8);
                break;
              case 4:
                console.log('Trying 2x scale with sharpening...');
                processedImg.scale(2).quality(100).contrast(0.3);
                break;
              case 5:
                console.log('Trying 3x scale...');
                processedImg.scale(3).quality(100);
                break;
              case 6:
                console.log('Trying invert colors...');
                processedImg.invert().contrast(0.5);
                break;
              case 7:
                console.log('Trying blur reduction...');
                processedImg.normalize().contrast(0.4).brightness(0.1);
                break;
              case 8:
                console.log('Trying edge enhancement...');
                processedImg.contrast(1.0).brightness(-0.1);
                break;
              case 9:
                console.log('Trying 4x scale with normalization...');
                processedImg.scale(4).normalize().quality(100);
                break;
              case 10:
                console.log('Trying extreme contrast...');
                processedImg.greyscale().contrast(1.5).brightness(0.2);
                break;
              case 11:
                console.log('Trying posterize...');
                processedImg.posterize(4).contrast(0.5);
                break;
              case 12:
                console.log('Trying final attempt with all enhancements...');
                processedImg.scale(2).greyscale().contrast(0.8).normalize().quality(100);
                break;
            }

            // Create QR code reader
            const qr = new QrCode();
            
            const qrPromise = new Promise((resolve, reject) => {
              qr.callback = (err, value) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(value);
                }
              };
            });

            // Decode QR code
            qr.decode(processedImg.bitmap);
            const result = await qrPromise;
            
            if (result && result.result) {
              qrData = result.result;
              console.log(`✅ QR Code detected on attempt ${attempts}:`, qrData);
              break;
            }
          } catch (attemptError) {
            console.log(`Attempt ${attempts} failed:`, attemptError.message);
          }
        }

        if (qrData) {
          console.log('🎯 QR code found, attempting to verify...');
          try {
            certificateData = await verifyCertificateOnline(qrData);
            certificateData.verificationMethod = 'QR Code';
            certificateData.extractedUrl = qrData;
          } catch (verifyError) {
            console.error('QR verification failed:', verifyError.message);
            certificateData = {
              status: 'Error',
              reason: 'QR code found but verification failed: ' + verifyError.message,
              verificationMethod: 'QR Code',
              extractedUrl: qrData
            };
          }
        } else {
          console.log('❌ No QR code detected after all attempts');
        }
      } catch (qrError) {
        console.error('QR detection process failed:', qrError.message);
      }

      // If QR failed, try OCR
      if (!certificateData) {
        console.log('Step 2: Attempting OCR...');
        try {
          const ocrText = await performOCR(filePath);
          console.log('OCR Text sample:', ocrText.substring(0, 200) + '...');
          
          const extractedUrl = extractUrlFromText(ocrText);
          
          if (extractedUrl) {
            console.log('🎯 URL found in OCR text, attempting to verify...');
            try {
              certificateData = await verifyCertificateOnline(extractedUrl);
              certificateData.verificationMethod = 'OCR + Online Verification';
              certificateData.extractedUrl = extractedUrl;
              certificateData.ocrText = ocrText.substring(0, 500); // Include sample of OCR text
            } catch (verifyError) {
              console.error('OCR URL verification failed:', verifyError.message);
              certificateData = {
                status: 'Error',
                reason: 'URL found in certificate but verification failed: ' + verifyError.message,
                verificationMethod: 'OCR',
                extractedUrl: extractedUrl,
                ocrText: ocrText.substring(0, 500)
              };
            }
          } else {
            // Check if OCR found certificate-related text
            const certKeywords = ['certificate', 'certified', 'completion', 'achievement', 'course', 'program'];
            const foundKeywords = certKeywords.filter(keyword => 
              ocrText.toLowerCase().includes(keyword)
            );
            
            if (foundKeywords.length > 0) {
              certificateData = {
                status: 'Partial',
                reason: 'Certificate text detected but no verification URL found',
                verificationMethod: 'OCR Text Analysis',
                foundKeywords: foundKeywords,
                ocrText: ocrText.substring(0, 500)
              };
            } else {
              certificateData = {
                status: 'Invalid',
                reason: 'No certificate content or verification URL found',
                verificationMethod: 'OCR',
                ocrText: ocrText.substring(0, 200)
              };
            }
          }
        } catch (ocrError) {
          console.error('OCR process failed:', ocrError.message);
          certificateData = {
            status: 'Error',
            reason: 'OCR processing failed: ' + ocrError.message,
            verificationMethod: 'OCR'
          };
        }
      }

      // Enhanced response with user name validation
      if (userName && certificateData.details && certificateData.details.recipientName) {
        const nameMatch = certificateData.details.recipientName.toLowerCase().includes(userName.toLowerCase()) ||
                         userName.toLowerCase().includes(certificateData.details.recipientName.toLowerCase());
        certificateData.nameMatch = nameMatch;
        if (!nameMatch) {
          certificateData.status = 'Name Mismatch';
          certificateData.reason = `Certificate recipient "${certificateData.details.recipientName}" does not match provided name "${userName}"`;
        }
      }

      safeResponse(certificateData);

    } catch (error) {
      console.error('💥 Verification process failed:', error);
      safeResponse({
        status: 'Error',
        reason: 'Certificate verification failed: ' + error.message,
        verificationMethod: 'Error'
      });
    } finally {
      // Clean up uploaded file
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('🧹 Cleaned up uploaded file');
        } catch (cleanupError) {
          console.error('🧹 Failed to cleanup file:', cleanupError.message);
        }
      }
    }
  });

  // Test OCR route
  router.post('/test-ocr', upload.single('certificate'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      console.log('Testing OCR on uploaded image...');
      const ocrText = await performOCR(req.file.path);
      const extractedUrl = extractUrlFromText(ocrText);
      
      res.json({ 
        success: true,
        extractedText: ocrText,
        foundUrl: extractedUrl,
        hasUrl: !!extractedUrl
      });
    } catch (err) {
      res.json({ 
        success: false, 
        error: err.message 
      });
    } finally {
      // Cleanup
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  });

  // Debug route to see what we can extract from a certificate URL
  router.get('/debug-cert/:id', async (req, res) => {
    const certId = req.params.id;
    const testUrls = [
      `https://unstop.com/certificate-preview/${certId}`,
      `https://www.credly.com/badges/${certId}`
    ];
    
    const results = [];
    
    for (const url of testUrls) {
      try {
        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        
        results.push({
          url: url,
          success: true,
          title: $('title').text(),
          h1: $('h1').map((i, el) => $(el).text().trim()).get(),
          h2: $('h2').map((i, el) => $(el).text().trim()).get(),
          h3: $('h3').map((i, el) => $(el).text().trim()).get(),
          bodyText: $('body').text().substring(0, 500)
        });
        
        break; // If successful, no need to try other URLs
      } catch (error) {
        results.push({
          url: url,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json(results);
  });

  return router;
}

module.exports = initCertificateRoutes;