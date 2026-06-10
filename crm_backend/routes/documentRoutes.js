const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

const getMimeTypeFromBuffer = (buffer) => {
  if (!buffer || buffer.length < 4) return null;
  // PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  return null;
};

const getMimeType = (filename) => {
  if (!filename) return 'application/octet-stream';
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'txt': return 'text/plain';
    case 'html': return 'text/html';
    default: return 'application/octet-stream';
  }
};

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Public (or could be Private, but keeping it simple for now)
router.get('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let contentType = document.contentType;
    if (!contentType || contentType === 'application/octet-stream') {
      contentType = getMimeType(document.filename);
      if (contentType === 'application/octet-stream') {
        const guessed = getMimeTypeFromBuffer(document.data);
        if (guessed) contentType = guessed;
      }
    }

    let filename = document.filename || 'document';
    if (!filename.includes('.')) {
      if (contentType === 'application/pdf') filename += '.pdf';
      else if (contentType === 'image/jpeg') filename += '.jpg';
      else if (contentType === 'image/png') filename += '.png';
    }

    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `inline; filename="${filename}"`);
    res.send(document.data);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving document', error: error.message });
  }
});

module.exports = router;
