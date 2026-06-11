const http = require('http');

const data = Buffer.from('test pdf content');
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

let postData = '';
postData += `--${boundary}\r\n`;
postData += `Content-Disposition: form-data; name="year"\r\n\r\n`;
postData += `2026-2027\r\n`;
postData += `--${boundary}\r\n`;
postData += `Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n`;
postData += `Content-Type: application/pdf\r\n\r\n`;
postData += data.toString();
postData += `\r\n--${boundary}--\r\n`;

const req = http.request({
  hostname: 'localhost',
  port: 5001,
  path: '/api/calendar/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(postData),
    'x-user-id': '6a2936ca1d7f9ae265524606' // Replace with a valid Admin user ID if needed
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', console.error);
req.write(postData);
req.end();
