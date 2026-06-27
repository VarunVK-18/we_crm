const http = require('http');

const data = JSON.stringify({
  companyId: "6a30ee12d7c1c1cd9c70fe65",
  email: "test-intake@example.com",
  serviceName: "GST Registration"
});

const req = http.request({
  hostname: 'localhost',
  port: 5001,
  path: '/api/intake/onboard',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'authorization': 'WEE-0306-2026'
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('Intake response:', body));
});
req.write(data);
req.end();

const data2 = JSON.stringify({
  company_id: "6a30ee12d7c1c1cd9c70fe65",
  email: "test-register@example.com",
  serviceName: "GST Registration",
  password: "password123"
});

const req2 = http.request({
  hostname: 'localhost',
  port: 5001,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data2)
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('Register response:', body));
});
req2.write(data2);
req2.end();
