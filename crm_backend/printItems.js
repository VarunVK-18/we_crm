const http = require('http');

http.get({
  hostname: 'localhost',
  port: 5001,
  path: '/api/my-checklists',
  headers: { 'x-user-id': '6a30efe2d7c1c1cd9c70fe6b' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    const pf = parsed.checklists.find(c => c.service_name.includes('PF'));
    if (pf) {
      console.log(JSON.stringify(pf.items, null, 2));
    }
  });
});
