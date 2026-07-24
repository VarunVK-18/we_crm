import { Component, OnInit, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';

type ServiceType = 'MCA' | 'DPIIT' | 'GST' | 'Trademark' | 'BIS' | 'Copyright' | 'Patent' | 'ITR' | 'DSC' | 'FSSAI' | 'DUNS' | 'TDS' | 'PF' | 'LEI' | 'IEC' | 'MSME';

interface DirectorCred {
  index: number;
  label: string;
  username: string;
  password: string;
  expiryDate: string;
}

interface ServiceForm {
  username: string;
  password: string;
  gstTrn: string;
  tan: string;
  pfCode: string;
  leiNumber: string;
  iecNumber: string;
  udyamNumber: string;
  issueDate: string;
  status: string;
  expiryDate: string;
  tokenPin: string;
  trackingNumber: string;
  directorCredentials: DirectorCred[];
}

const OCR_SERVICES: ServiceType[] = ['Trademark', 'BIS', 'Copyright', 'Patent'];

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-details.html',
  styleUrl: './service-details.css'
})
export class ServiceDetailsComponent implements OnInit, OnChanges {
  @Input() clientId = '';
  @Input() directorCount = 0;
  @Input() currentServiceName = '';

  serviceList: { type: ServiceType; label: string; sub?: string }[] = [
    { type: 'MCA',       label: 'MCA',       sub: 'Ministry of Corporate Affairs' },
    { type: 'DPIIT',     label: 'DPIIT',     sub: 'Startup India' },
    { type: 'GST',       label: 'GST',       sub: 'Goods & Services Tax' },
    { type: 'Trademark', label: 'Trademark', sub: 'IPO India' },
    { type: 'BIS',       label: 'BIS',       sub: 'Bureau of Indian Standards' },
    { type: 'Copyright', label: 'Copyright', sub: 'Copyright Office' },
    { type: 'Patent',    label: 'Patent',    sub: 'Patent Office' },
    { type: 'ITR',       label: 'ITR',       sub: 'Income Tax Return' },
    { type: 'DSC',       label: 'DSC',       sub: 'Digital Signature Certificate' },
    { type: 'FSSAI',     label: 'FSSAI',     sub: 'Food Safety' },
    { type: 'DUNS',      label: 'DUNS',      sub: 'Data Universal Numbering System' },
  ];

  get filteredServiceList() {
    if (!this.currentServiceName) return this.serviceList;
    
    const s = this.currentServiceName.toLowerCase();
    let matchType: ServiceType | null = null;
    
    if (s.includes('private limited') || s.includes('llp') || s.includes('opc') || s.includes('incorporation') || s.includes('mca') || s.includes('company')) matchType = 'MCA';
    else if (s.includes('startup') || s.includes('dpiit')) matchType = 'DPIIT';
    else if (s.includes('msme') || s.includes('udyam')) matchType = 'MSME';
    else if (s.includes('gst')) matchType = 'GST';
    else if (s.includes('trademark') || s.includes('trade mark')) matchType = 'Trademark';
    else if (s.includes('bis')) matchType = 'BIS';
    else if (s.includes('copyright')) matchType = 'Copyright';
    else if (s.includes('patent')) matchType = 'Patent';
    else if (s.includes('tds')) matchType = 'TDS';
    else if (s.includes('lei') || s.includes('legal entity')) matchType = 'LEI';
    else if (s.includes('iec') || s.includes('import export')) matchType = 'IEC';
    else if (s.includes('pf') || s.includes('epfo')) matchType = 'PF';
    else if (s.includes('itr') || s.includes('income tax')) matchType = 'ITR';
    else if (s.includes('dsc') || s.includes('digital signature')) matchType = 'DSC';
    else if (s.includes('fssai') || s.includes('food')) matchType = 'FSSAI';
    else if (s.includes('duns')) matchType = 'DUNS';
    
    if (matchType) {
      return this.serviceList.filter(svc => svc.type === matchType);
    }
    
    // Default to empty array if no match is found so we don't show all 13 services
    return [];
  }


  isLoading = signal(false);
  records: Record<string, any> = {};
  forms: Record<string, ServiceForm> = {};
  expandedCards: Set<string> = new Set();
  isSaving: Record<string, boolean> = {};
  showPass: Record<string, boolean> = {};
  isOcrProcessing: Record<string, boolean> = {};
  ocrError: Record<string, string> = {};
  ocrSuccess: Record<string, boolean> = {};
  editingMap: Record<string, boolean> = {};

  toastMessage = signal("");
  toastType = signal<"success" | "error">("success");

  constructor(private api: Api) {}

  ngOnInit() { this.initForms(); if (this.clientId) this.loadAll(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes["clientId"] && !changes["clientId"].firstChange) { this.loadAll(); }
    if (changes["directorCount"]) { this.rebuildDirectorFields(); }
    if (changes["currentServiceName"]) {
      // Auto-expand if there's exactly one matched service
      const list = this.filteredServiceList;
      if (list.length === 1) {
        this.expandedCards.add(list[0].type);
      }
    }
  }

  // ── Form Init ──
  initForms() {
    for (const svc of this.serviceList) {
      this.forms[svc.type] = this.blankForm();
      this.isSaving[svc.type] = false;
      this.isOcrProcessing[svc.type] = false;
      this.ocrError[svc.type] = '';
      this.ocrSuccess[svc.type] = false;
      this.editingMap[svc.type] = false;
    }
    this.rebuildDirectorFields();
  }

  blankForm(): ServiceForm {
    return { username: '', password: '', gstTrn: '', tan: '', pfCode: '', leiNumber: '', iecNumber: '', udyamNumber: '', issueDate: '', status: 'active', expiryDate: '', tokenPin: 'wealthempires', trackingNumber: '', directorCredentials: [] };
  }

  rebuildDirectorFields() {
    const count = Math.max(0, this.directorCount || 0);
    for (const type of ['MCA', 'ITR'] as ServiceType[]) {
      if (!this.forms[type]) this.forms[type] = this.blankForm();
      const existing = this.forms[type].directorCredentials;
      const next: DirectorCred[] = [];
      for (let i = 0; i < count; i++) {
        next.push(existing[i] ?? { index: i, label: `Director ${i + 1}`, username: '', password: '', expiryDate: '' });
      }
      this.forms[type].directorCredentials = next;
    }
  }

  // ── Load all records ──
  loadAll() {
    if (!this.clientId) return;
    this.isLoading.set(true);
    this.api.get<any>(`service-details/${this.clientId}`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res?.success) {
          this.records = {};
          for (const r of res.data) { this.records[r.serviceType] = r; }
          this.populateForms();
        }
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  populateForms() {
    for (const svc of this.serviceList) {
      const rec = this.records[svc.type];
      if (!rec) continue;
      const f = this.forms[svc.type];
      f.username = rec.username || '';
      f.password = rec.password || '';
      f.gstTrn = rec.gstTrn || '';
      f.expiryDate = rec.expiryDate ? rec.expiryDate.substring(0, 10) : '';
      f.tokenPin = rec.tokenPin || 'wealthempires';
      f.trackingNumber = rec.trackingNumber || '';
      // Director creds
      if (Array.isArray(rec.directorCredentials) && rec.directorCredentials.length) {
        f.directorCredentials = rec.directorCredentials.map((d: any, i: number) => ({
          index: d.index ?? i,
          label: d.label || `Director ${i + 1}`,
          username: d.username || '',
          password: d.password || '',
          expiryDate: d.expiryDate ? d.expiryDate.substring(0, 10) : ''
        }));
      }
    }
  }

  getRecord(type: string): any { return this.records[type] || null; }
  isExpanded(type: string): boolean { return this.expandedCards.has(type); }
  toggleCard(type: string) {
    if (this.expandedCards.has(type)) this.expandedCards.delete(type);
    else this.expandedCards.add(type);
  }
  isOcrService(type: string): boolean { return (OCR_SERVICES as string[]).includes(type); }
  togglePass(key: string) { this.showPass[key] = !this.showPass[key]; }

  // ── Save ──
  saveRecord(type: string) {
    if (!this.clientId) { this.showToast('Select a client first.', 'error'); return; }
    this.isSaving[type] = true;
    const f = this.forms[type];
    const payload: any = {
      serviceType: type,
      username: f.username,
      password: f.password,
      gstTrn: f.gstTrn,
      expiryDate: f.expiryDate || null,
      tokenPin: f.tokenPin,
      trackingNumber: f.trackingNumber,
      directorCredentials: f.directorCredentials
    };
    this.api.post<any>(`service-details/${this.clientId}`, payload).subscribe({
      next: (res) => {
        this.isSaving[type] = false;
        if (res?.success) {
          this.records[type] = res.data;
          this.editingMap[type] = false;
          this.showToast(`${type} credentials saved!`, 'success');
        }
      },
      error: (err) => {
        this.isSaving[type] = false;
        this.showToast(err.error?.message || 'Failed to save.', 'error');
      }
    });
  }

  // ── Delete ──
  deleteRecord(type: string) {
    if (!confirm(`Delete ${type} service details? This cannot be undone.`)) return;
    this.api.delete<any>(`service-details/${this.clientId}/${type}`).subscribe({
      next: (res) => {
        if (res?.success) {
          delete this.records[type];
          this.forms[type] = this.blankForm();
          this.rebuildDirectorFields();
          this.showToast(`${type} details deleted.`, 'success');
        }
      },
      error: (err) => { this.showToast(err.error?.message || 'Failed to delete.', 'error'); }
    });
  }

  // ── OCR Upload ──
  onOcrFileSelected(event: any, type: string) {
    const file: File = event.target.files?.[0];
    if (!file) return;
    if (!this.clientId) { this.showToast('Select a client first.', 'error'); return; }
    this.isOcrProcessing[type] = true;
    this.ocrError[type] = '';
    this.ocrSuccess[type] = false;

    const fd = new FormData();
    fd.append('receipt', file);

    this.api.post<any>(`service-details/${this.clientId}/${type}/ocr-upload`, fd).subscribe({
      next: (res) => {
        this.isOcrProcessing[type] = false;
        if (res?.success && res.trackingNumber) {
          this.forms[type].trackingNumber = res.trackingNumber;
          this.records[type] = res.data;
          this.ocrSuccess[type] = true;
          this.showToast(`Tracking number extracted: ${res.trackingNumber}`, 'success');
        }
        // Reset file input
        event.target.value = '';
      },
      error: (err) => {
        this.isOcrProcessing[type] = false;
        this.ocrError[type] = err.error?.message || 'OCR failed. Please enter the tracking number manually.';
        event.target.value = '';
      }
    });
  }

  // ── Expiry helpers ──
  getExpiryStatus(dateStr: string): 'active' | 'expiringSoon' | 'expired' | 'none' {
    if (!dateStr) return 'none';
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'expired';
    if (diff <= 30) return 'expiringSoon';
    return 'active';
  }

  getExpiryLabel(dateStr: string): string {
    const s = this.getExpiryStatus(dateStr);
    if (s === 'expired') return 'Expired';
    if (s === 'expiringSoon') return 'Expiring Soon';
    return 'Active';
  }

  // ── Toast ──
  private toastTimer: any;
  showToast(msg: string, type: 'success' | 'error' = 'success') {
    clearTimeout(this.toastTimer);
    this.toastMessage.set(msg);
    this.toastType.set(type);
    this.toastTimer = setTimeout(() => this.toastMessage.set(''), 3500);
  }
}
