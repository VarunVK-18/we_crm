import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DraftService {

  constructor() {}

  saveDraft(orderId: string, formName: string, data: any): void {
    if (!orderId || !formName) return;
    const key = `draft_${formName}_${orderId}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  loadDraft(orderId: string, formName: string): any {
    if (!orderId || !formName) return null;
    const key = `draft_${formName}_${orderId}`;
    const draft = localStorage.getItem(key);
    if (draft) {
      try {
        return JSON.parse(draft);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  clearDraft(orderId: string, formName: string): void {
    if (!orderId || !formName) return;
    const key = `draft_${formName}_${orderId}`;
    localStorage.removeItem(key);
  }
}
