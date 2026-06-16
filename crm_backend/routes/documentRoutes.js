const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

function parseWrittenDate(dateStr) {
  try {
    const monthMatch = dateStr.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
    if (!monthMatch) return null;
    const month = monthMatch[1];
    
    let year = new Date().getFullYear();
    const yrStr = dateStr.toLowerCase().replace(/\s+/g, ' ');
    if (yrStr.includes('two thousand eighteen')) year = 2018;
    else if (yrStr.includes('two thousand nineteen')) year = 2019;
    else if (yrStr.includes('two thousand twenty one')) year = 2021;
    else if (yrStr.includes('two thousand twenty two')) year = 2022;
    else if (yrStr.includes('two thousand twenty three')) year = 2023;
    else if (yrStr.includes('two thousand twenty four')) year = 2024;
    else if (yrStr.includes('two thousand twenty five')) year = 2025;
    else if (yrStr.includes('two thousand twenty')) year = 2020;
    else {
      const yrMatch = dateStr.match(/\b(20\d{2})\b/);
      if (yrMatch) year = parseInt(yrMatch[1]);
    }

    let day = 1;
    const digitDayMatch = yrStr.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (digitDayMatch) {
      day = parseInt(digitDayMatch[1]);
    } else {
      const days = {
        thirtieth: 30, 'thirty first': 31, 'thirty-first': 31,
        'twenty ninth': 29, 'twenty-ninth': 29, 'twenty eighth': 28, 'twenty-eighth': 28,
        'twenty seventh': 27, 'twenty-seventh': 27, 'twenty sixth': 26, 'twenty-sixth': 26,
        'twenty fifth': 25, 'twenty-fifth': 25, 'twenty fourth': 24, 'twenty-fourth': 24,
        'twenty third': 23, 'twenty-third': 23, 'twenty second': 22, 'twenty-second': 22,
        'twenty first': 21, 'twenty-first': 21, twentieth: 20, nineteenth: 19,
        eighteenth: 18, seventeenth: 17, sixteenth: 16, fifteenth: 15, fourteenth: 14,
        thirteenth: 13, twelfth: 12, eleventh: 11, tenth: 10, ninth: 9, eighth: 8,
        seventh: 7, sixth: 6, fifth: 5, fourth: 4, third: 3, second: 2, first: 1
      };
      for (const [key, val] of Object.entries(days)) {
        if (yrStr.includes(key)) {
          day = val;
          break;
        }
      }
    }
    return new Date(Date.UTC(year, new Date(`${month} 1, 2000`).getMonth(), day));
  } catch (e) {
    return null;
  }
}

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

// @desc    Upload & Extract OCR data from PDF Incorporation Certificate
// @route   POST /api/documents/extract-incorporation
// @access  Private
router.post('/documents/extract-incorporation', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Only PDF files are supported for auto-fill.' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    let companyName = '';
    let cin = '';
    let tan = '';
    let pan = '';
    let incorporationDate = null;

    const nameMatch = text.match(/I hereby certify that\s+([^]+?)\s+is incorporated/i);
    if (nameMatch) companyName = nameMatch[1].replace(/\n/g, ' ').trim();

    const cinMatch = text.match(/([L|U]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6})/);
    if (cinMatch) cin = cinMatch[1].trim();

    const tanMatch = text.match(/\b([A-Z]{4}\d{5}[A-Z])\b/);
    if (tanMatch) tan = tanMatch[1].trim();
    
    // Look for PAN match separately (typically 5 letters, 4 digits, 1 letter)
    // Make sure we don't accidentally grab TAN, so we use a different regex or explicitly look for it
    const panRegex = /\b([A-Z]{5}\d{4}[A-Z])\b/g;
    let match;
    while ((match = panRegex.exec(text)) !== null) {
      // If the match is not the same as TAN/CIN, and we haven't found a PAN yet
      if (!cin.includes(match[1]) && match[1] !== tan) {
        pan = match[1];
        break;
      }
    }

    let dateMatch = text.match(/this\s+(.+?)\s+under the Companies Act/i);
    if (!dateMatch) {
      dateMatch = text.match(/this\s+([^.]+?(?:two thousand[a-z\s]*|20\d{2}))/i);
    }
    if (!dateMatch) {
      dateMatch = text.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:day of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*(?:two thousand[a-z\s]*|20\d{2}))/i);
    }
    if (dateMatch) {
      incorporationDate = parseWrittenDate(dateMatch[1].trim());
    }

    res.status(200).json({
      success: true,
      data: {
        companyName,
        cin,
        tan,
        pan,
        incorporationDate
      }
    });

  } catch (error) {
    console.error('PDF Extraction Error:', error);
    res.status(500).json({ success: false, message: 'Failed to extract data from PDF', error: error.message });
  }
});

module.exports = router;
