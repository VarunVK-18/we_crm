import { Component, OnInit, OnChanges, SimpleChanges, signal, inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-complete-company-profile-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, PdfViewerModule],
  templateUrl: './complete-company-profile-form.html',
  styleUrls: ['../forms-shared.css', './complete-company-profile-form.css']
})
export class CompleteCompanyProfileFormComponent implements OnInit, OnChanges {
  @Input() isEmbedded = false;
  @Input() currentEntity: string = '';
  @Output() formCompleted = new EventEmitter<void>();

  orderId = signal<string>('');
  serviceName = signal<string>('');
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  success = signal<boolean>(false);
  errorMessage = signal<string>('');

  schema: any = null;
  order: any = null;
  currentUser: any = null;

  // Storage for all dynamic field inputs
  formData: { [key: string]: any } = {};
  files: { [key: string]: File } = {};
  existingDocs: { [key: string]: any } = {};
  ocrValidating: { [key: string]: boolean } = {};
  
  ocrErrorTitle = '';
  ocrErrorMessage = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public location = inject(Location);
  public api = inject(Api);
  private draftService = inject(DraftService);
  private confirmDialog = inject(ConfirmDialogService);
  private cdr = inject(ChangeDetectorRef);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentEntity'] && !changes['currentEntity'].isFirstChange()) {
      // Clear form data so it doesn't bleed over
      this.formData = {};
      this.files = {};
      this.existingDocs = {};
      if (this.schema && this.schema.fields) {
        this.initFieldValues(this.schema.fields, '');
      }
      this.fetchProfileData();
    }
  }

  docViewerSrc = '';
  docViewerName = '';
  docViewerType = signal<'pdf' | 'image' | ''>('');
  isDocViewerOpen = signal(false);
  isDocViewerLoading = signal(false);

  async openDocViewer(url: string, name: string, event: Event) {
    event.preventDefault();
    let finalUrl = url.startsWith('http') ? url : (this.api.serverUrl + 'api/documents/' + url);
    this.docViewerName = name || 'Document';
    this.docViewerType.set('');
    this.isDocViewerLoading.set(true);
    this.isDocViewerOpen.set(true);

    try {
      const res = await fetch(finalUrl, { headers: { 'Range': 'bytes=0-3' } });
      if (!res.ok) {
        alert('Document not found or no longer available.');
        this.closeDocViewer();
        return;
      }
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        this.docViewerType.set('pdf');
      } else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        this.docViewerType.set('image');
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        this.docViewerType.set('image');
      } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        this.docViewerType.set('image');
      } else {
        const cType = res.headers.get('content-type') || '';
        if (cType.includes('pdf')) this.docViewerType.set('pdf');
        else if (cType.includes('image')) this.docViewerType.set('image');
      }
    } catch (e) {
      const lowerUrl = finalUrl.toLowerCase();
      if (lowerUrl.includes('.pdf') || lowerUrl.includes('pdf')) {
        this.docViewerType.set('pdf');
      } else if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)/)) {
        this.docViewerType.set('image');
      }
    }

    this.docViewerSrc = finalUrl;
    this.isDocViewerLoading.set(false);
  }

  closeDocViewer() {
    this.isDocViewerOpen.set(false);
    this.isDocViewerLoading.set(false);
    this.docViewerSrc = '';
    this.docViewerName = '';
    this.docViewerType.set('');
  }

  forceDownload(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    let docName = this.docViewerName || 'document';
    this.api.downloadFile(this.docViewerSrc, docName);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) this.orderId.set(params['id']);
      if (params['serviceName']) {
        this.serviceName.set(decodeURIComponent(params['serviceName']));
      }
      this.loadData();
    });
  }

  loadData() {
    this.loading.set(true);
    this.errorMessage.set('');

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try { this.currentUser = JSON.parse(savedUser); } catch (e) {}
    }

    // Auto-prefill company name from the user profile so it's always present
    if (this.currentUser) {
      const autoName =
        this.currentEntity ||
        this.currentUser.companyName ||
        this.currentUser.company_name ||
        this.currentUser.client_entities?.[0]?.entityName ||
        this.currentUser.client_entities?.[0]?.company_name ||
        '';
      if (autoName) {
        this.formData['companyName'] = autoName;
      }
    }

    if (this.orderId()) {
      this.api.get<any>(`checklists/${this.orderId()}`).subscribe({
        next: (orderRes: any) => {
          this.order = orderRes?.checklist || orderRes?.order || orderRes;
          this.serviceName.set('Company Profile');
          this.fetchFormSchema('Company Profile');
        },
        error: (err: any) => {
          this.serviceName.set('Company Profile');
          this.fetchFormSchema('Company Profile');
        }
      });
    } else {
      this.serviceName.set('Company Profile');
      this.fetchFormSchema('Company Profile');
    }
  }

  fetchProfileData() {
    const user = this.currentUser;
    // Use currentEntity if available, else try all possible field names where the company/entity name might be stored
    const entityName = this.currentEntity ||
      user?.companyName ||
      user?.company_name ||
      user?.client_entities?.[0]?.entityName ||
      user?.client_entities?.[0]?.company_name ||
      '';

    if (entityName && !this.formData['companyName']) {
      this.formData['companyName'] = entityName;
    }

    const t = new Date().getTime();
    this.api.get<any>(`entity-profile?entityName=${encodeURIComponent(entityName)}&_t=${t}`).subscribe({
      next: (res: any) => {
        if (res && res.profile) {
          const profile = res.profile;
          
          if (profile.entityName) this.formData['companyName'] = profile.entityName;

          const flatData = { ...profile, ...profile.dynamicProfileData };
          // For explicit mappings that have different names in the schema vs DB:
          if (profile.entityName) flatData['companyName'] = profile.entityName;
          if (profile.pan) flatData['companyPan'] = profile.pan;
          if (profile.email) flatData['companyEmail'] = profile.email;
          if (profile.phone) flatData['companyPhone'] = profile.phone;
          if (profile.address) flatData['registeredAddress'] = profile.address;
          if (profile.directorPhone) flatData['directorMobile'] = profile.directorPhone;

          // Because submitForm stripped the group prefixes (e.g. businessDetails.businessType -> businessType),
          // we must map them back to the full dot-notation paths expected by the form schema.
          Object.keys(this.formData).forEach(path => {
             const parts = path.split(/\.|\[|\]/).filter(s => s.length > 0);
             const lastPart = parts[parts.length - 1];
             if (flatData[lastPart] !== undefined && flatData[lastPart] !== '') {
                this.formData[path] = flatData[lastPart];
             }
          });

          if (profile.dynamicProfileData) {
            Object.assign(this.formData, profile.dynamicProfileData);
          }

          const mapExistingDoc = (docIdKey: string, docNameKey: string, formField: string, fallbackKey: string) => {
             if (profile[docIdKey]) {
                this.existingDocs[formField] = { fileUrl: profile[docIdKey], name: profile[docNameKey] || 'Uploaded Document' };
             } else if (profile.dynamicProfileData && profile.dynamicProfileData[`${fallbackKey}File`]) {
                this.existingDocs[formField] = { fileUrl: profile.dynamicProfileData[`${fallbackKey}File`], name: 'Uploaded Document' };
             }
          };

          mapExistingDoc('incorpCertDocId', 'incorpCertDocName', 'documents.incorpCert', 'incorpCert');
          mapExistingDoc('panCardDocId', 'panCardDocName', 'documents.panCard', 'panCard');
          mapExistingDoc('directorPanDocId', 'directorPanDocName', 'documents.directorPanDoc', 'directorPanDoc');
          mapExistingDoc('aadhaarDocId', 'aadhaarDocName', 'documents.aadhaar', 'aadhaar');
          mapExistingDoc('gstDocId', 'gstDocName', 'documents.gstDoc', 'gstDoc');
          mapExistingDoc('bankDocId', 'bankDocName', 'documents.bankStatement', 'bankStatement');
          mapExistingDoc('moaDocId', 'moaDocName', 'documents.moa', 'moa');
          mapExistingDoc('aoaDocId', 'aoaDocName', 'documents.aoa', 'aoa');
          mapExistingDoc('udyamCertDocId', 'udyamCertDocName', 'documents.udyamCert', 'udyamCert');
          mapExistingDoc('trademarkCertDocId', 'trademarkCertDocName', 'documents.trademarkCert', 'trademarkCert');
          mapExistingDoc('isoCertDocId', 'isoCertDocName', 'documents.isoCert', 'isoCert');
          mapExistingDoc('salesInvoiceDocId', 'salesInvoiceDocName', 'documents.salesInvoice', 'salesInvoice');
          mapExistingDoc('purchaseBillsDocId', 'purchaseBillsDocName', 'documents.purchaseBills', 'purchaseBills');

          this.cdr.detectChanges();
        }
      },
      error: (err: any) => console.error('Error fetching profile:', err)
    });
  }
  fetchFormSchema(serviceName: string) {
    this.api.getFormByServiceName(serviceName).subscribe({
      next: (res: any) => {
        this.schema = res;
        this.initFieldValues(this.schema.fields || [], '');
        this.loadSavedDraft();
        this.fetchProfileData();
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loading.set(false);
        this.errorMessage.set(`No dynamic form blueprint configured for "${serviceName}".`);
        this.cdr.detectChanges();
      }
    });
  }

  initFieldValues(fields: any[], parentPath: string) {
    fields.forEach(field => {
      const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name;

      if (field.type === 'group') {
        if (field.subFields && field.subFields.length > 0) {
          this.initFieldValues(field.subFields, currentPath);
        }
      } else if (field.type === 'array') {
        let count = field.arrayConfig?.minItems || 1;
        if (field.arrayConfig?.dynamicCountRef && this.order?.details) {
          const dynCount = this.order.details[field.arrayConfig.dynamicCountRef];
          if (dynCount) count = parseInt(dynCount, 10) || count;
        }
        field._itemCount = count;
        for (let i = 0; i < count; i++) {
          if (field.subFields) {
            this.initFieldValues(field.subFields, `${currentPath}[${i}]`);
          }
        }
      } else if (field.type === 'checkbox') {
        if (this.formData[currentPath] === undefined) {
          this.formData[currentPath] = false;
        }
      } else if (field.type === 'dropdown') {
        if (this.formData[currentPath] === undefined) {
          this.formData[currentPath] = field.options && field.options.length > 0 ? field.options[0] : '';
        }
      } else {
        if (this.formData[currentPath] === undefined) {
          this.formData[currentPath] = '';
        }
      }
    });
  }

  getArrayItems(count: number): number[] {
    return Array.from({ length: count || 1 }, (_, i) => i);
  }

  isFieldVisible(field: any, parentPath: string): boolean {
    if (!field.visibilityCondition) return true;
    const cond = field.visibilityCondition;
    const targetField = cond.field;
    if (!targetField) return true;

    let targetPath = targetField;
    if (parentPath && parentPath.includes('[')) {
      const arrayPrefix = parentPath.substring(0, parentPath.lastIndexOf(']') + 1);
      targetPath = `${arrayPrefix}.${targetField}`;
    }

    const actualVal = this.formData[targetPath] ?? this.formData[targetField];
    if (cond.equals !== undefined) {
      return String(actualVal).trim() === String(cond.equals).trim();
    }
    return true;
  }

  onFileSelected(event: any, pathKey: string, allowedExtensions: string[]) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5 MB limit.');
        event.target.value = '';
        return;
      }
      if (allowedExtensions && allowedExtensions.length > 0) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext && !allowedExtensions.map(e => e.toLowerCase().replace('.', '')).includes(ext)) {
          alert(`Invalid file type. Allowed formats: ${allowedExtensions.join(', ')}`);
          event.target.value = '';
          return;
        }
      }

      // Real-time OCR validation
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        this.ocrValidating[pathKey] = true;
        this.cdr.detectChanges();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fieldName', pathKey);

        this.api.post<any>('ocr/validate', formData).subscribe({
          next: (res) => {
            this.ocrValidating[pathKey] = false;
            if (res.success) {
              this.files[pathKey] = file;
              this.saveDraft();
              this.cdr.detectChanges();
            } else {
              this.ocrErrorTitle = 'Validation Failed';
              this.ocrErrorMessage = res.message || 'Invalid document.';
              event.target.value = '';
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            this.ocrValidating[pathKey] = false;
            this.ocrErrorTitle = 'Validation Error';
            this.ocrErrorMessage = err.error?.message || 'Failed to validate document. Please upload a clear and correct valid document.';
            event.target.value = '';
            this.cdr.detectChanges();
          }
        });
      } else {
        this.files[pathKey] = file;
        this.saveDraft();
        this.cdr.detectChanges();
      }
    }
  }

  removeFile(pathKey: string) {
    delete this.files[pathKey];
    delete this.existingDocs[pathKey];
    this.saveDraft();
    this.cdr.detectChanges();
  }

  getFileName(pathKey: string): string {
    if (this.files[pathKey]) return this.files[pathKey].name;
    if (this.existingDocs[pathKey]) return this.existingDocs[pathKey].name;
    return '';
  }

  loadSavedDraft() {
    if (!this.orderId()) return;
    const draftKey = `DynamicForm_${this.serviceName()}`;
    const draft = this.draftService.loadDraft(this.orderId(), draftKey);
    if (draft && typeof draft === 'object') {
      Object.keys(draft).forEach(k => {
        if (draft[k] !== undefined && draft[k] !== null) {
          this.formData[k] = draft[k];
        }
      });
    }
  }

  showBackModal = signal<boolean>(false);

  goBack() {
    this.onBack();
  }

  onBack() {
    this.showBackModal.set(true);
  }

  closeBackModal() {
    this.showBackModal.set(false);
  }

  saveAndLeave() {
    this.saveDraft();
    this.showBackModal.set(false);
    this.location.back();
  }

  discardAndLeave() {
    if (this.orderId()) {
      const draftKey = `DynamicForm_${this.serviceName()}`;
      this.draftService.clearDraft(this.orderId(), draftKey);
    }
    this.showBackModal.set(false);
    this.location.back();
  }

  saveDraft() {
    if (!this.orderId()) return;
    const draftKey = `DynamicForm_${this.serviceName()}`;
    this.draftService.saveDraft(this.orderId(), draftKey, this.formData);
  }

  invalidFields = new Set<string>();
  fieldErrors: Record<string, string> = {};

  onTextInput(val: string, field: any, path: string) {
    const lowerName = (field.name || '').toLowerCase();
    const lowerLabel = (field.label || '').toLowerCase();
    const hasPan = /\bpan\b/.test(lowerName) || /\bpan\b/.test(lowerLabel);
    const isNotNameOrDate = !/name|date|dob|first|last/.test(lowerName) && !/name|date|dob|first|last/.test(lowerLabel);
    
    if (hasPan && isNotNameOrDate) {
      const upper = (val || '').toUpperCase();
      this.formData[path] = upper;
    } else {
      this.formData[path] = val;
    }
    this.validateField(field, path);
  }

  validateField(f: any, currentPath: string): { isMissing: boolean, formatError: string } {
    let isMissing = false;
    let formatError = '';

    if (f.type === 'file') {
      if (f.required && !this.files[currentPath] && !this.existingDocs[currentPath]) {
        isMissing = true;
      }
    } else if (f.type === 'checkbox') {
      if (f.required && !this.formData[currentPath]) {
        isMissing = true;
      }
    } else {
      const val = this.formData[currentPath];
      if (f.required && (val === undefined || val === null || String(val).trim() === '')) {
        isMissing = true;
      } else if (val !== undefined && val !== null && String(val).trim() !== '') {
        const strVal = String(val).trim();
        const lowerName = (f.name || '').toLowerCase();
        const lowerLabel = (f.label || '').toLowerCase();

        const hasPan = /\bpan\b/.test(lowerName) || /\bpan\b/.test(lowerLabel);
        const isNotNameOrDate = !/name|date|dob|first|last/.test(lowerName) && !/name|date|dob|first|last/.test(lowerLabel);

        const regexPattern = f.validation?.regex || f.validation?.pattern;
        const regexMsg = f.validation?.errorMessage || f.validation?.message || 'Invalid format.';
        if (regexPattern) {
          const re = new RegExp(regexPattern);
          if (!re.test(strVal)) {
            formatError = regexMsg;
          }
        } else if (hasPan && isNotNameOrDate) {
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(strVal)) {
            formatError = 'Invalid PAN format. Example: ABCDE1234F';
          }
        } else if (lowerName.includes('aadhaar') || lowerLabel.includes('aadhaar')) {
          if (!/^\d{12}$/.test(strVal)) {
            formatError = 'Aadhaar must be exactly 12 digits.';
          }
        } else if (f.type === 'phone' || lowerName.includes('phone') || lowerLabel.includes('mobile')) {
          if (!/^\d{10}$/.test(strVal)) {
            formatError = 'Phone number must be exactly 10 digits.';
          }
        } else if (f.type === 'email' || lowerName.includes('email') || lowerLabel.includes('mail')) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
            formatError = 'Invalid email address.';
          }
        } else if (lowerName.includes('name') || lowerLabel.includes('name')) {
          if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9\s\.\-]+$/.test(strVal)) {
            formatError = 'Name must contain at least one letter and can only include alphanumeric characters, spaces, dots, or hyphens.';
          }
        } else if (lowerName.includes('model') || lowerLabel.includes('model')) {
          if (!/^[a-zA-Z0-9\s\.\-]+$/.test(strVal)) {
            formatError = 'Model number must only contain alphanumeric characters, spaces, dots, or hyphens.';
          }
        } else if (lowerName === 'gstin' || lowerLabel.includes('gstin') || lowerLabel.includes('gst number')) {
          if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(strVal)) {
            formatError = 'Invalid GSTIN format. Example: 22AAAAA0000A1Z5';
          }
        } else if (lowerName === 'cin' || lowerLabel.includes('cin')) {
          if (!/^([LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}|[A-Z]{3}-\d{4})$/i.test(strVal)) {
            formatError = 'Invalid format. Provide a 21-character CIN or an 8-character LLPIN (e.g. AAA-1234).';
          }
        } else if (lowerName.includes('udyam') || lowerLabel.includes('udyam')) {
          if (!/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(strVal)) {
            formatError = 'Invalid UDYAM format. Example: UDYAM-MH-18-0000001';
          }
        } else if (lowerName.includes('postalcode') || lowerName.includes('pincode') || lowerLabel.includes('postal code') || lowerLabel.includes('pin code')) {
          if (!/^\d{6}$/.test(strVal)) {
            formatError = 'PIN Code must be exactly 6 digits.';
          }
        } else if (lowerName === 'din' || lowerLabel.includes('din')) {
          if (!/^\d{8}$/.test(strVal)) {
            formatError = 'DIN must be exactly 8 digits.';
          }
        } else if (lowerName === 'tan' || lowerLabel === 'tan' || lowerLabel.includes('tan number')) {
          if (!/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(strVal)) {
            formatError = 'Invalid TAN format. Example: ABCD12345E';
          }
        } else if (lowerName.includes('ifsc') || lowerLabel.includes('ifsc')) {
          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(strVal)) {
            formatError = 'Invalid IFSC format. Example: HDFC0001234';
          }
        } else if ((lowerName.includes('account') || lowerLabel.includes('account')) && !lowerName.includes('type') && !lowerLabel.includes('type')) {
          if (!/^\d{9,18}$/.test(strVal)) {
            formatError = 'Bank account number must be between 9 and 18 digits.';
          }
        }
      }
    }

    if (isMissing || formatError) {
      this.invalidFields.add(currentPath);
      this.fieldErrors = {
        ...this.fieldErrors,
        [currentPath]: formatError || 'This field is required.'
      };
    } else {
      this.invalidFields.delete(currentPath);
      const newErrors = { ...this.fieldErrors };
      delete newErrors[currentPath];
      this.fieldErrors = newErrors;
    }
    
    return { isMissing, formatError };
  }

  async submitForm() {
    this.invalidFields.clear();
    this.fieldErrors = {};
    const missingFieldLabels: string[] = [];
    const missingFieldPaths: string[] = [];

    const checkRequired = (fields: any[], parentPath: string) => {
      fields.forEach(f => {
        if (!this.isFieldVisible(f, parentPath)) return;
        const currentPath = parentPath ? `${parentPath}.${f.name}` : f.name;

        if (f.type === 'group' && f.subFields) {
          checkRequired(f.subFields, currentPath);
        } else if (f.type === 'array' && f.subFields) {
          const count = f._itemCount || 1;
          for (let i = 0; i < count; i++) {
            checkRequired(f.subFields, `${currentPath}[${i}]`);
          }
        } else if (f.required || (this.formData[currentPath] !== undefined && this.formData[currentPath] !== null && String(this.formData[currentPath]).trim() !== '')) {
          const res = this.validateField(f, currentPath);
          if (res.isMissing || res.formatError) {
            missingFieldLabels.push(f.label || f.name);
            missingFieldPaths.push(currentPath);
          }
        }
      });
    };

    if (this.schema?.fields) {
      checkRequired(this.schema.fields, '');
    }

    if (missingFieldPaths.length > 0) {
      this.errorMessage.set(`Please complete all required fields: ${missingFieldLabels.slice(0, 3).join(', ')}${missingFieldLabels.length > 3 ? '...' : ''}`);
      
      // Scroll to the first invalid field directly
      setTimeout(() => {
        const firstErrorEl = document.getElementById('field-' + missingFieldPaths[0]);
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Submit Application',
      message: 'Are you sure you want to submit your form details? You cannot edit them after submission.',
      confirmText: 'Submit',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    this.submitting.set(true);
    this.errorMessage.set('');
    this.success.set(false);

    // Build structured data
    const structuredData: any = {};
    const setNestedValue = (path: string, value: any) => {
      const parts = path.split(/\.|\[|\]/).filter(s => s.length > 0);
      let current = structuredData;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const nextPart = parts[i + 1];
        const isNextArray = !isNaN(Number(nextPart));

        if (typeof current === 'object' && !Array.isArray(current)) {
          if (!current[part]) {
            current[part] = isNextArray ? [] : {};
          }
          current = current[part];
        } else if (Array.isArray(current)) {
          const idx = parseInt(part, 10);
          while (current.length <= idx) current.push(isNextArray ? [] : {});
          current = current[idx];
        }
      }
      const lastPart = parts[parts.length - 1];
      if (Array.isArray(current)) {
        const idx = parseInt(lastPart, 10);
        while (current.length <= idx) current.push(null);
        current[idx] = value;
      } else {
        current[lastPart] = value;
      }
    };

    Object.keys(this.formData).forEach(key => {
      setNestedValue(key, this.formData[key]);
    });

    const formDataPayload = new FormData();
    const appendedKeys = new Set<string>();
    Object.keys(this.formData).forEach(key => {
      // Strip group prefixes (e.g. 'businessDetails.companyName' -> 'companyName')
      const parts = key.split(/\.|\[|\]/).filter(s => s.length > 0);
      const lastPart = parts[parts.length - 1];
      
      if (!appendedKeys.has(lastPart)) {
        formDataPayload.append(lastPart, this.formData[key]);
        appendedKeys.add(lastPart);
      }
    });
    const entityName = this.currentEntity || this.currentUser?.companyName;
    if (entityName) {
      formDataPayload.append('entityName', entityName);
    }
    Object.keys(this.files).forEach(key => {
      const parts = key.split(/\.|\[|\]/).filter(s => s.length > 0);
      const lastPart = parts[parts.length - 1];
      formDataPayload.append(lastPart, this.files[key]);
    });
    Object.keys(this.existingDocs).forEach(key => {
      const parts = key.split(/\.|\[|\]/).filter(s => s.length > 0);
      const lastPart = parts[parts.length - 1];
      formDataPayload.append(`${lastPart}_existing`, this.existingDocs[key].fileUrl);
    });

    const handleSuccess = (res: any) => {
      this.submitting.set(false);
      if (res && res.success !== false) {
        if (this.orderId()) {
          this.draftService.clearDraft(this.orderId(), `DynamicForm_${this.serviceName()}`);
        }
        const scoreMsg = res.complianceScore !== undefined ? ` Your compliance score is ${res.complianceScore}%` : '';
        if (this.isEmbedded) {
          this.confirmDialog.confirm({
            title: 'Success',
            message: `Profile saved successfully!${scoreMsg}`,
            confirmText: 'OK',
            hideCancel: true
          }).then(() => {
            this.formCompleted.emit();
          });
        } else {
          alert(`Profile saved successfully!${scoreMsg}`);
          if (this.orderId()) {
            this.router.navigate(['/client/service', this.orderId()]);
          } else {
            this.location.back();
          }
        }
      } else {
        this.errorMessage.set(res.message || 'Error occurred while saving profile.');
      }
    };

    const handleError = (err: any) => {
      this.submitting.set(false);
      if (err.status === 400 && err.error && err.error.errors) {
        this.errorMessage.set('Validation Error. Please check the fields.');
      } else {
        this.errorMessage.set(err.error?.message || err.message || 'An error occurred while saving.');
      }
    };

    // Always update the central profile first to calculate the health score
    this.api.post<any>(`users/me/mca-profile`, formDataPayload).subscribe({
      next: (profileRes: any) => {
        if (this.orderId()) {
          // If this was filled from an order, also submit it to the order to advance service progress
          this.api.post<any>(`orders/${this.orderId()}/submit-mca-form`, formDataPayload).subscribe({
            next: (orderRes: any) => handleSuccess(profileRes),
            error: handleError
          });
        } else {
          handleSuccess(profileRes);
        }
      },
      error: handleError
    });
  }

  closeOcrError() {
    this.ocrErrorTitle = '';
    this.ocrErrorMessage = '';
  }
}
