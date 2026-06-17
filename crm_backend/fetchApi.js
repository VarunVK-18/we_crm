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
    if (!parsed.checklists) {
      console.log(parsed);
      return;
    }
    const pf = parsed.checklists.find(c => c.service_name.includes('PF'));
    if (pf) {
      console.log("PF:", pf.service_name);
      console.log("Assigned:", pf.assigned_to ? pf.assigned_to.role : "null");
      console.log("Items:", pf.items.length);
      console.log("isActionStep:", pf.items.length > 0 ? pf.items[0].isActionStep : "no items");
    } else {
      console.log("No PF found");
    }
  });
});
