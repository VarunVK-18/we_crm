const compressUploads = require('../../middleware/compressUploads');
const sharp = require('sharp');
const fs = require('fs').promises;

describe('compressUploads Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      files: [],
      file: null
    };
    mockRes = {};
    nextFunction = jest.fn();
  });

  it('should skip if no files are provided', async () => {
    await compressUploads(mockReq, mockRes, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should compress a JPEG image and reduce its size', async () => {
    // Generate a dummy solid color 2000x2000 image buffer
    const largeImageBuffer = await sharp({
      create: {
        width: 2000,
        height: 2000,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    })
    .jpeg({ quality: 100 })
    .toBuffer();

    const originalSize = largeImageBuffer.length;

    mockReq.file = {
      buffer: largeImageBuffer,
      mimetype: 'image/jpeg',
      originalname: 'test_image.jpeg',
      size: originalSize
    };

    await compressUploads(mockReq, mockRes, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.file.size).toBeLessThan(originalSize);
    expect(mockReq.file.buffer.length).toBeLessThan(originalSize);
    expect(mockReq.file.mimetype).toBe('image/jpeg');
    expect(mockReq.file.originalname).toBe('test_image.jpg');
  });

  it('should fallback to original PDF buffer if Ghostscript is missing or fails', async () => {
    // Create a dummy PDF-like buffer
    const dummyPdfBuffer = Buffer.from('%PDF-1.4\\n%\\x82\\x82\\x82\\x82\\n1 0 obj\\n<< /Type /Catalog /Pages 2 0 R >>\\nendobj\\n', 'utf-8');
    const originalSize = dummyPdfBuffer.length;

    mockReq.file = {
      buffer: dummyPdfBuffer,
      mimetype: 'application/pdf',
      originalname: 'document.pdf',
      size: originalSize
    };

    await compressUploads(mockReq, mockRes, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.file.size).toBe(originalSize);
    expect(mockReq.file.buffer).toBe(dummyPdfBuffer);
  });
});
