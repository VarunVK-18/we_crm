import { Injectable } from '@angular/core';
import { Api } from '../api';
import { firstValueFrom } from 'rxjs';

export interface PaymentDetails {
  rawText: string;
  amount?: number;
  transactionId?: string;
  paymentTimestamp?: string;
  upiId?: string;
  accountLastFour?: string;
  isVerified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  constructor(private api: Api) { }

  /**
   * Uploads the receipt image to the backend for Gemini OCR extraction.
   */
  async extractPaymentDetails(file: File, bankSettings: any): Promise<PaymentDetails> {
    const formData = new FormData();
    formData.append('image', file);
    
    if (bankSettings) {
      formData.append('bankSettings', JSON.stringify(bankSettings));
    }

    try {
      // Use the new backend Gemini OCR route
      const response = await firstValueFrom(this.api.post<any>('ocr/extract', formData));
      
      if (response && response.success && response.data) {
        return {
          rawText: response.data.rawText || '',
          amount: response.data.amount,
          transactionId: response.data.transactionId,
          paymentTimestamp: response.data.paymentTimestamp,
          upiId: response.data.upiId,
          accountLastFour: response.data.accountLastFour,
          isVerified: response.data.isVerified
        };
      } else {
        throw new Error(response?.message || 'Failed to extract payment details from OCR API');
      }
    } catch (error: any) {
      console.error('OCR Extraction Error:', error);
      
      // Fallback response so the UI doesn't crash completely
      return {
        rawText: '',
        isVerified: false
      };
    }
  }

  async extractTextFromImage(file: File): Promise<string> {
    const details = await this.extractPaymentDetails(file, null);
    return details.rawText;
  }
}