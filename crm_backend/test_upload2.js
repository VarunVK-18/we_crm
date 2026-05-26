const fs = require('fs');
const path = require('path');
const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const payload = `--${boundary}\r
Content-Disposition: form-data; name="docName"\r
\r
Aadhar Card\r
--${boundary}\r
Content-Disposition: form-data; name="document"; filename="test.txt"\r
Content-Type: text/plain\r
\r
Hello World\r
--${boundary}--\r
`;

const req = http.request({
  hostname: '127.0.0.1',
  port: 5001,
  path: '/api/checklists/someid/upload-documents', // The id doesn't matter for the multer test, it will fail at checklist find, but pass multer!
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
