import { Injectable } from '@angular/core';
import { createWorker, Worker } from 'tesseract.js';

export interface PaymentDetails {
  rawText: string;
  amount?: number;
  transactionId?: string;
  paymentTimestamp?: string;
  isVerified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OcrService {

  // English number-word -> value, used to parse spelled-out amounts (Saves Paytm receipts)
  private readonly ONES: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
    fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
    nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
    seventy: 70, eighty: 80, ninety: 90
  };
  private readonly SCALES: Record<string, number> = {
    hundred: 100, thousand: 1000, lakh: 100000, lac: 100000, crore: 10000000
  };

  constructor() { }

  /**
   * Full pipeline: OCR the receipt, robustly locate + re-read the amount,
   * and parse the remaining payment details.
   */
  async extractPaymentDetails(file: File, bankSettings: any): Promise<PaymentDetails> {
    const worker = await createWorker('eng');
    try {
      const pass1 = await worker.recognize(file);
      const rawText = pass1.data.text;

      const details = this.parsePaymentDetails(rawText, bankSettings);

      const robustAmount = await this.detectAmount(worker, file, pass1.data, rawText);
      
      if (robustAmount !== undefined && !isNaN(robustAmount)) {
        details.amount = robustAmount;
      }

      return details;
    } finally {
      await worker.terminate();
    }
  }

  async extractTextFromImage(file: File): Promise<string> {
    const worker = await createWorker('eng');
    try {
      const result = await worker.recognize(file);
      return result.data.text;
    } catch (error) {
      console.error('OCR Extraction Error:', error);
      throw error;
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Locates the amount on the receipt and re-reads it reliably.
   */
  private async detectAmount(
    worker: Worker,
    file: File,
    pageData: Tesseract.Page,
    rawText: string
  ): Promise<number | undefined> {
    const spelled = this.parseSpelledOutAmount(rawText);
    if (spelled !== null) {
      return spelled;
    }

    const lines: any[] = (pageData as any).lines || [];
    let best: { bbox: { x0: number; y0: number; x1: number; y1: number }; height: number } | null = null;

    for (const line of lines) {
      const text = (line.text || '').trim();
      const digits = (text.match(/\d/g) || []).length;
      if (digits === 0) continue;
      
      const nonSpaceLen = text.replace(/\s/g, '').length;
      if (nonSpaceLen === 0 || digits / nonSpaceLen < 0.2) continue;

      const height = line.bbox.y1 - line.bbox.y0;
      if (!best || height > best.height) {
        best = { bbox: line.bbox, height };
      }
    }

    if (!best) return undefined;

    try {
      // FIX 1: Allow downscaling! Tesseract chokes on text taller than ~40px. 
      // High-res mobile screenshots have massive amounts. We MUST shrink them.
      let scale = 40 / best.height;
      
      // Cap upscaling to prevent memory issues, but do NOT cap downscaling.
      if (scale > 4) scale = 4;

      // Pass best.height instead of a static '10' so we can calculate proportional padding
      const canvas = await this.cropAndUpscale(file, best.bbox, best.height, scale);

      await worker.setParameters({
        tessedit_pageseg_mode: '7' as any, // PSM.SINGLE_LINE
      });
      
      const focused = await worker.recognize(canvas);
      
      await worker.setParameters({
        tessedit_pageseg_mode: '3' as any, // Restore default
      });

      let rawFocused = focused.data.text || '';
      
      // Strip all spacing first
      rawFocused = rawFocused.replace(/\s+/g, '');
      
      // Map basic confusions back to digits
      rawFocused = rawFocused.replace(/[oO]/g, '0').replace(/[sS]/g, '5').replace(/[lI]/g, '1');
      
      // Match the largest continuous block of numbers
      const digitBlocks = rawFocused.match(/[\d\.]+/g);
      if (!digitBlocks) return undefined;
      
      const largestBlock = digitBlocks.reduce((a, b) => a.length > b.length ? a : b);
      const cleaned = largestBlock.replace(/[^\d.]/g, '');
      
      if (!cleaned) return undefined;
      const value = parseFloat(cleaned);
      return isNaN(value) ? undefined : value;
    } catch (error) {
      console.error('Amount re-OCR failed, falling back to regex parsing:', error);
      return undefined;
    }
  }

  private async cropAndUpscale(
    file: File,
    bbox: { x0: number; y0: number; x1: number; y1: number },
    height: number,
    scale: number
  ): Promise<HTMLCanvasElement> {
    const bitmap = await createImageBitmap(file);

    // FIX 2: Proportional padding (25% of height).
    // Prevents the rightmost "0" from being cut off if the bounding box is too tight on huge numbers.
    const padding = Math.floor(height * 0.25);

    const x = Math.max(0, bbox.x0 - padding);
    const y = Math.max(0, bbox.y0 - padding);
    const w = Math.min(bbox.x1 - bbox.x0 + padding * 2, bitmap.width - x);
    const h = Math.min(bbox.y1 - bbox.y0 + padding * 2, bitmap.height - y);

    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d')!;
    
    // FIX 3: Fill a white background to prevent alpha channel/transparency edge bleeding
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, x, y, w, h, 0, 0, w * scale, h * scale);
    return canvas;
  }

  private parseSpelledOutAmount(rawText: string): number | null {
    const match = rawText.toUpperCase().match(/RUPEES\s+([A-Z\s-]+?)\s+ONLY/);
    if (!match) return null;

    const tokens = match[1]
      .toLowerCase()
      .replace(/-/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0 && t !== 'and');

    let total = 0;
    let current = 0;

    for (const token of tokens) {
      if (token in this.ONES) {
        current += this.ONES[token];
      } else if (token in this.SCALES) {
        const scale = this.SCALES[token];
        if (scale === 100) {
          current = (current || 1) * scale;
        } else {
          total += (current || 1) * scale;
          current = 0;
        }
      } else {
        return null;
      }
    }

    total += current;
    return total > 0 ? total : null;
  }

  parsePaymentDetails(rawText: string, bankSettings: any): PaymentDetails {
    const details: PaymentDetails = {
      rawText,
      isVerified: false
    };

    const cleanedText = rawText.replace(/\n/g, ' ').toUpperCase();
    console.log('[OCR Result]', cleanedText);

    // --- Time Extraction Logic ---
    const dateFirst = cleanedText.match(/(\d{1,2}\s+[A-Z]{3,4}\s+\d{4}(?:[,\sAT]*\d{1,2}[:\.]\d{2}\s*(?:AM|PM)?)?)/i);
    const timeFirst = cleanedText.match(/(\d{1,2}[:\.]\d{2}\s*(?:AM|PM)?\s*,?\s*\d{1,2}\s+[A-Z]{3,4}\s+\d{4})/i);
    const hasTime = (s: string) => /\d{1,2}[:\.]\d{2}/.test(s);

    let chosenTimestamp: string | undefined;
    if (dateFirst && timeFirst) {
      chosenTimestamp = hasTime(dateFirst[1]) ? dateFirst[1] : timeFirst[1];
    } else {
      chosenTimestamp = (dateFirst && dateFirst[1]) || (timeFirst && timeFirst[1]) || undefined;
    }

    if (chosenTimestamp) {
      details.paymentTimestamp = chosenTimestamp.replace(/AT/i, '').trim();
    } else {
      const isoMatch = cleanedText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}(?:\s+\d{1,2}[:\.]\d{2}(?:\s*(?:AM|PM))?)?)/i);
      if (isoMatch) {
         details.paymentTimestamp = isoMatch[1];
      } else {
         const looseDate = cleanedText.match(/([A-Z]{3,4}\s+\d{1,2}[, ]*\d{4})/i);
         if (looseDate) details.paymentTimestamp = looseDate[1];
      }
    }

    // --- Amount Extraction Logic ---
    const toIndex = cleanedText.indexOf('TO:');
    const searchRegion = toIndex > -1 ? cleanedText.slice(0, toIndex) : cleanedText;

    const gpayMatch = searchRegion.match(/(?:[^\d]*)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:COMPLETED|C0MPLETED|SUCCESSFUL)/);
    
    if (gpayMatch) {
        details.amount = parseFloat(gpayMatch[1].replace(/,/g, ''));
    } else {
        const amountMatch = searchRegion.match(/(?:₹|RS\.?|INR|€|£|\$)\s*([\d,]+(?:\.\d{1,2})?)/);
        if (amountMatch) {
          details.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        } else {
          const genericMatch = searchRegion.match(/(?:PAID|AMOUNT|RECEIVED|SUCCESSFUL|PAYMENT OF)\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/);
          if (genericMatch) {
            details.amount = parseFloat(genericMatch[1].replace(/,/g, ''));
          } else {
            const commaNumberMatch = searchRegion.match(/(?:\s|^)([\d]{1,2},[\d]{3}(?:,[\d]{3})*(?:\.\d{1,2})?)(?:\s|$)/);
            if (commaNumberMatch) {
              details.amount = parseFloat(commaNumberMatch[1].replace(/,/g, ''));
            } else {
              const standaloneMatch = searchRegion.match(/(?:\s|^)(\d{1,7})(?:\.\d{1,2})?(?:\s|$)/g);
              if (standaloneMatch) {
                for (const m of standaloneMatch) {
                  const numStr = m.trim().split('.')[0]; 
                  const num = parseInt(numStr);
                  if (num > 0 && num !== 2023 && num !== 2024 && num !== 2025 && num !== 2026) {
                    if (num % 10 === 0) {
                      details.amount = num;
                      break;
                    }
                  }
                }
              }
            }
          }
        }
    }

    // --- Transaction ID / UTR Logic ---
    const tidMatch = cleanedText.match(/(?:UTR|TRANSACTION ID|TXN ID|REF NO|REFERENCE NUMBER|UPI REF ID|TID)\s*[:\-]?\s*([A-Z0-9]{10,16})/);
    if (tidMatch) {
      details.transactionId = tidMatch[1];
    } else {
      const fallbackUtr = cleanedText.match(/(?:\s|^)(\d{12})(?:\s|$)/);
      if (fallbackUtr) {
        details.transactionId = fallbackUtr[1];
      }
    }

    // --- Bank Verification Logic ---
    if (bankSettings) {
      const { savings_account_last_four, current_account_last_four } = bankSettings;
      let matched = false;
      let gstApplicable = true;

      if (savings_account_last_four && savings_account_last_four.length >= 4) {
        if (cleanedText.includes(savings_account_last_four)) {
          matched = true;
          gstApplicable = !!bankSettings.add_gst_savings;
        }
      }

      if (!matched && current_account_last_four && current_account_last_four.length >= 4) {
        if (cleanedText.includes(current_account_last_four)) {
          matched = true;
          gstApplicable = !!bankSettings.add_gst_current;
        }
      }

      details.isVerified = matched;
      (details as any).isGstApplicable = gstApplicable;
    }

    return details;
  }
}