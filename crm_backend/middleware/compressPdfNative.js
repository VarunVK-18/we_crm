const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const { createCanvas } = require('canvas');

// Dynamically import pdfjs-dist for Node (ESM module support)
let pdfjsLib;
async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}

// Standardize standard fonts to avoid warnings
const STANDARD_FONT_DATA_URL = 'node_modules/pdfjs-dist/standard_fonts/';

/**
 * NodeCanvasFactory to render PDF pages in Node.js
 */
class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

/**
 * Aggressively compresses a PDF by rasterizing each page to an image,
 * compressing the image with Sharp, and rebuilding the PDF.
 * @param {Buffer} inputBuffer 
 * @returns {Promise<Buffer>}
 */
async function compressPdfNative(inputBuffer) {
  try {
    const pdfjs = await getPdfJs();
    const data = new Uint8Array(inputBuffer);
    
    // Load the PDF Document using pdfjs
    const loadingTask = pdfjs.getDocument({
      data,
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
      disableFontFace: true,
      ignoreErrors: true,
    });
    const pdfDocument = await loadingTask.promise;

    const numPages = pdfDocument.numPages;
    
    // Create a brand new, empty PDF using pdf-lib
    const newPdfDoc = await PDFDocument.create();

    const canvasFactory = new NodeCanvasFactory();
    
    // Render at a high scale (e.g. 2.0 = ~144 DPI) for clarity, but sharp will compress it
    const SCALE = 2.0; 
    const QUALITY = 60; // JPEG quality

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      
      const viewport = page.getViewport({ scale: SCALE });
      
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
      
      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport: viewport,
        canvasFactory: canvasFactory
      };
      
      // Render the page onto the canvas
      await page.render(renderContext).promise;
      
      // Extract raw image buffer from canvas
      const rawImageBuffer = canvasAndContext.canvas.toBuffer('image/png');
      
      // Use Sharp to convert to highly compressed JPEG
      const compressedJpegBuffer = await sharp(rawImageBuffer)
        .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
        .toBuffer();
        
      // Embed the JPEG into the new PDF
      const pdfImage = await newPdfDoc.embedJpg(compressedJpegBuffer);
      
      // Add a page matching the image dimensions
      // Convert scaled dimensions back to PDF points
      const pdfPage = newPdfDoc.addPage([viewport.width / SCALE, viewport.height / SCALE]);
      
      pdfPage.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: viewport.width / SCALE,
        height: viewport.height / SCALE
      });
      
      // Free memory
      canvasFactory.destroy(canvasAndContext);
    }
    
    // Save the fully rebuilt PDF
    const compressedPdfBytes = await newPdfDoc.save();
    const compressedPdfBuffer = Buffer.from(compressedPdfBytes);
    
    return compressedPdfBuffer;
    
  } catch (error) {
    console.warn('[COMPRESSION NATIVE] Rasterization failed, falling back:', error.message);
    throw error;
  }
}

module.exports = {
  compressPdfNative
};
