const https = require('https');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const payload = `--${boundary}\r
Content-Disposition: form-data; name="Aadhar Card"; filename="test.txt"\r
Content-Type: text/plain\r
\r
Hello World\r
--${boundary}--\r
`;

const req = https.request({
  hostname: 'peoplesoft-develop.onrender.com',
  path: '/api/checklists/someid/upload-documents',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': payload.length,
    'x-user-id': 'someuser'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.on('error', e => console.error('Error:', e.message));
req.write(payload);
req.end();
