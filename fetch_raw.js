fetch('http://127.0.0.1:5001/api/forms/service/Company%20Profile')
  .then(r => r.text())
  .then(t => {
    const matches = t.match(/"pattern":\s*"(.*?)"/g);
    console.log(matches);
  });
