const sharp = require('sharp');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Helper function to compress a PDF using Ghostscript
const compressPDF = async (inputBuffer) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if Ghostscript is available
      const gsCommand = os.platform() === 'win32' ? 'gswin64c' : 'gs';
      
      const tempInput = path.join(os.tmpdir(), `temp_in_${Date.now()}.pdf`);
      const tempOutput = path.join(os.tmpdir(), `temp_out_${Date.now()}.pdf`);
      
      await fs.writeFile(tempInput, inputBuffer);
      
      const command = `${gsCommand} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${tempOutput}" "${tempInput}"`;
      
      exec(command, async (error) => {
        if (error) {
          // Ghostscript not found or failed, return original buffer gracefully
          console.warn('[COMPRESSION] Ghostscript failed or not installed. Skipping PDF compression.');
          await fs.unlink(tempInput).catch(() => {});
          return resolve(inputBuffer);
        }
        
        try {
          const compressedBuffer = await fs.readFile(tempOutput);
          await fs.unlink(tempInput).catch(() => {});
          await fs.unlink(tempOutput).catch(() => {});
          
          // Only use compressed if it's actually smaller
          if (compressedBuffer.length < inputBuffer.length) {
            resolve(compressedBuffer);
          } else {
            resolve(inputBuffer);
          }
        } catch (readErr) {
          resolve(inputBuffer); // Fallback
        }
      });
    } catch (err) {
      resolve(inputBuffer); // Fallback
    }
  });
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
              .resize(1920, 1920, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
              })
              .jpeg({ quality: 75, progressive: true }) // Convert/compress to progressive JPEG
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
