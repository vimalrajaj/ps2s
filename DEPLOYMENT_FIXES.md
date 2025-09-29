# University Management System - Deployment Notes

## Serverless Deployment Fixes Applied:

1. **File System Issues Fixed:**
   - Removed static directory creation (`uploads/`)
   - Updated multer to use `/tmp` directory in production
   - Made file operations serverless-compatible

2. **Database Connection Optimized:**
   - Removed invalid MySQL connection options (acquireTimeout, timeout, reconnect)
   - Disabled database initialization in production
   - Simplified connection pool configuration

3. **Dependencies Handled:**
   - Core functionality maintained
   - Heavy dependencies (puppeteer, tesseract) gracefully handled
   - Session management using memory store (suitable for serverless)

## Known Limitations in Serverless:
- File uploads are temporary (stored in /tmp)
- No persistent file storage
- Database must be cloud-hosted
- Some heavy processing may timeout

## Next Steps:
- Deploy to Vercel with fixes
- Test core functionality
- Add persistent file storage if needed (AWS S3, Cloudinary, etc.)