const sharp = require('sharp');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const { compressPdfNative } = require('./compressPdfNative');

// Helper function to compress a PDF using compressPdfNative
const compressPDF = async (inputBuffer) => {
  try {
    const compressedBuffer = await compressPdfNative(inputBuffer);
    
    // Only use compressed if it's actually smaller
    if (compressedBuffer.length < inputBuffer.length) {
      return compressedBuffer;
    }
    return inputBuffer;
  } catch (err) {
    // If native rasterization fails (e.g. invalid/encrypted PDF), fallback to pdf-lib structural compression
    console.warn('[COMPRESSION] Native rasterization failed. Attempting pdf-lib fallback compression.');
    try {
      const { PDFDocument } = require('pdf-lib');
      const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
      const pdfBytes = await pdfDoc.save();
      const fallbackBuffer = Buffer.from(pdfBytes);
      
      if (fallbackBuffer.length < inputBuffer.length) {
        return fallbackBuffer;
      }
    } catch (fallbackErr) {
      console.warn('[COMPRESSION] pdf-lib fallback also failed or skipped:', fallbackErr.message);
    }
    
    return inputBuffer;
  }
};

const compressUploads = async (req, res, next) => {
  try {
    // If no files were uploaded, move to next middleware
    if (!req.files && !req.file) {
      return next();
    }

    // Normalize files into an array for easier processing
    const files = req.file ? [req.file] : (Array.isArray(req.files) ? req.files : Object.values(req.files).flat());

    for (const file of files) {
      // Only process files in memory (multer memoryStorage)
      if (file.buffer) {
        const mimeType = file.mimetype;

        if (mimeType.startsWith('image/')) {
          // Compress Image using sharp
          try {
            const compressedBuffer = await sharp(file.buffer)
              .resize(2500, 2500, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
              })
              // Use high visual quality (90) which retains max visual fidelity without ballooning file sizes
              .jpeg({ quality: 90, progressive: true, chromaSubsampling: '4:4:4' })
              .toBuffer();
              
            // Check if compressed is smaller
            if (compressedBuffer.length < file.buffer.length) {
              file.buffer = compressedBuffer;
              file.mimetype = 'image/jpeg';
              file.originalname = file.originalname.replace(/\.[^/.]+$/, "") + ".jpg";
              file.size = compressedBuffer.length;
            }
          } catch (err) {
            console.error('[COMPRESSION] Image compression failed:', err);
            // Fallback to original
          }
        } else if (mimeType === 'application/pdf') {
          // Compress PDF using Ghostscript (if available)
          try {
            const compressedBuffer = await compressPDF(file.buffer);
            file.buffer = compressedBuffer;
            file.size = compressedBuffer.length;
          } catch (err) {
            console.error('[COMPRESSION] PDF compression failed:', err);
            // Fallback to original
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('[COMPRESSION] General error in compression middleware:', error);
    next(); // Don't block upload if compression fails
  }
};

module.exports = compressUploads;
