const fs = require('fs');
const http = require('http');

async function testUpload() {
  const fetch = (await import('node-fetch')).default;
  const FormData = (await import('form-data')).default;

  const form = new FormData();
  form.append('year', '2026-2027');
  form.append('file', Buffer.from('test pdf content'), {
    filename: 'test.pdf',
    contentType: 'application/pdf',
  });

  // Since we need an admin x-user-id, let's fetch one from DB first, or bypass auth.
  // We can just send a dummy one and see if we get 401.
  
  try {
    const res = await fetch('http://localhost:5001/api/calendar/upload', {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'x-user-id': '6a2936ca1d7f9ae265524606' // Just a dummy or previous one
      },
      body: form
    });
    
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text}`);
  } catch(e) {
    console.error(e);
  }
}
testUpload();
