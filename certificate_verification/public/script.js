document.getElementById('verificationForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData();
    const nameInput = document.getElementById('name');
    const fileInput = document.getElementById('certificate');
    const resultDiv = document.getElementById('result');

    formData.append('name', nameInput.value);
    formData.append('certificate', fileInput.files[0]);

    // Check if file is selected
    if (!fileInput.files[0]) {
        resultDiv.textContent = 'Please select a certificate file to upload.';
        resultDiv.style.color = 'red';
        return;
    }

    // Show loading message
    resultDiv.textContent = 'Processing certificate...';
    resultDiv.style.color = 'blue';

    try {
        const response = await fetch('/verify', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status === 'Valid') {
            resultDiv.innerHTML = `
                <div style="color: green;">
                    <strong>✓ Certificate is Valid!</strong><br>
                    Name: ${result.certificate.name}<br>
                    Course: ${result.certificate.course}<br>
                    Certificate ID: ${result.certificate.id}<br>
                    ${result.message ? `<br><em>${result.message}</em>` : ''}
                    ${result.note ? `<br><small>${result.note}</small>` : ''}
                </div>
            `;
        } else if (result.status === 'PartiallyVerified') {
            resultDiv.innerHTML = `
                <div style="color: orange;">
                    <strong>⚠️ Certificate Partially Verified</strong><br>
                    Name: ${result.certificate.name}<br>
                    Course: ${result.certificate.course}<br>
                    Certificate ID: ${result.certificate.id}<br>
                    <br><em>${result.message}</em>
                    ${result.note ? `<br><small>${result.note}</small>` : ''}
                    ${result.action ? `<br><br><strong>Action Required:</strong> ${result.action}` : ''}
                </div>
            `;
        } else if (result.status === 'Invalid') {
            resultDiv.innerHTML = `
                <div style="color: red;">
                    <strong>✗ Certificate is Invalid!</strong><br>
                    Reason: ${result.reason || 'Unknown error occurred during verification'}
                </div>
            `;
        } else {
            // Handle unexpected response structure
            resultDiv.innerHTML = `
                <div style="color: red;">
                    <strong>✗ Verification Error!</strong><br>
                    ${result.message || result.reason || 'An unexpected error occurred during verification'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error verifying certificate:', error);
        resultDiv.innerHTML = `
            <div style="color: red;">
                <strong>Error:</strong> An error occurred while verifying the certificate.<br>
                Please try again or contact support.
            </div>
        `;
    }
});