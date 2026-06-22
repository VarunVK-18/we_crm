const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const getMimeTypeFromBufferSync = (buffer) => {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf';
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
  return null;
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath, stat) => {
    if (!path.extname(filePath)) {
      try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4);
        fs.readSync(fd, buffer, 0, 4, 0);
        fs.closeSync(fd);
        const mime = getMimeTypeFromBufferSync(buffer);
        if (mime) {
          res.set('Content-Type', mime);
          const ext = mime === 'application/pdf' ? 'pdf' : (mime === 'image/jpeg' ? 'jpg' : 'png');
          res.set('Content-Disposition', `inline; filename="document.${ext}"`);
        } else {
          res.set('Content-Type', 'application/octet-stream');
          res.set('Content-Disposition', 'attachment; filename="document.bin"');
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
}));

app.listen(5002, () => {
  console.log('Test server on 5002');
  const http = require('http');
  http.get('http://localhost:5002/uploads/dpiit/e9ef6daf46327be83ca2d9c752c16d47', (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    process.exit(0);
  });
});
