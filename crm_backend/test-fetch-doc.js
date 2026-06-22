const http = require('http');
const req = http.get('http://localhost:5001/api/documents/6a3523d1c83a3c65a3c4cdeb', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let chunks = [];
  res.on('data', (d) => chunks.push(d));
  res.on('end', () => {
    const data = Buffer.concat(chunks);
    console.log('Downloaded length:', data.length);
    console.log('First 20 hex:', data.slice(0, 20).toString('hex'));
  });
});
