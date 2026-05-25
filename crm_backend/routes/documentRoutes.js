const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

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

    res.set('Content-Type', document.contentType);
    res.set('Content-Disposition', `inline; filename="${document.filename}"`);
    res.send(document.data);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving document', error: error.message });
  }
});

module.exports = router;
