import { Component, OnInit, OnChanges, SimpleChanges, signal, inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';

@Component({
  selector: 'app-mca-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './mca-form.html',
  styleUrls: ['../forms-shared.css', './mca-form.css']
})
export class McaFormComponent implements OnInit, OnChanges {
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

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public location = inject(Location);
  private api = inject(Api);
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
          if (profile.pan) this.formData['companyPan'] = profile.pan;
          if (profile.cin) this.formData['cin'] = profile.cin;
          if (profile.incorporationDate) this.formData['incorporationDate'] = profile.incorporationDate;
          if (profile.email) this.formData['companyEmail'] = profile.email;
          if (profile.phone) this.formData['companyPhone'] = profile.phone;
          if (profile.address) this.formData['registeredAddress'] = profile.address;
          if (profile.gstin) this.formData['gstin'] = profile.gstin;
          if (profile.directorName) this.formData['directorName'] = profile.directorName;
          if (profile.directorEmail) this.formData['directorEmail'] = profile.directorEmail;
          if (profile.directorPhone) this.formData['directorMobile'] = profile.directorPhone;
          if (profile.directorPan) this.formData['directorPan'] = profile.directorPan;
          if (profile.directorDin) this.formData['directorDin'] = profile.directorDin;

          if (profile.dynamicProfileData) {
            Object.assign(this.formData, profile.dynamicProfileData);
          }

          const mapExistingDoc = (docIdKey: string, docNameKey: string, formField: string) => {
             if (profile[docIdKey]) {
                this.existingDocs[formField] = { fileUrl: profile[docIdKey], name: profile[docNameKey] || 'Uploaded Document' };
             } else if (profile.dynamicProfileData && profile.dynamicProfileData[`${formField}File`]) {
                this.existingDocs[formField] = { fileUrl: profile.dynamicProfileData[`${formField}File`], name: 'Uploaded Document' };
             }
          };

          mapExistingDoc('incorpCertDocId', 'incorpCertDocName', 'coi');
          mapExistingDoc('panCardDocId', 'panCardDocName', 'pan');
          mapExistingDoc('directorPanDocId', 'directorPanDocName', 'directorPanDoc');
          mapExistingDoc('aadhaarDocId', 'aadhaarDocName', 'aadhaar');
          mapExistingDoc('gstDocId', 'gstDocName', 'gstCert');
          mapExistingDoc('bankDocId', 'bankDocName', 'bankStatement');
          mapExistingDoc('moaDocId', 'moaDocName', 'moa');
          mapExistingDoc('aoaDocId', 'aoaDocName', 'aoa');
          mapExistingDoc('udyamCertDocId', 'udyamCertDocName', 'udyamCert');
          mapExistingDoc('trademarkCertDocId', 'trademarkCertDocName', 'trademarkCert');
          mapExistingDoc('isoCertDocId', 'isoCertDocName', 'isoCert');
          mapExistingDoc('salesInvoiceDocId', 'salesInvoiceDocName', 'salesInvoice');
          mapExistingDoc('purchaseBillsDocId', 'purchaseBillsDocName', 'purchaseBills');

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
      this.files[pathKey] = file;
      this.saveDraft();
      this.cdr.detectChanges();
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

  onTextInput(event: any, field: any, path: string) {
    const lowerName = (field.name || '').toLowerCase();
    const lowerLabel = (field.label || '').toLowerCase();
    const hasPan = /\bpan\b/.test(lowerName) || /\bpan\b/.test(lowerLabel);
    const isNotNameOrDate = !/name|date|dob|first|last/.test(lowerName) && !/name|date|dob|first|last/.test(lowerLabel);
    
    if (hasPan && isNotNameOrDate) {
      const upper = event.target.value.toUpperCase();
      event.target.value = upper;
      this.formData[path] = upper;
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

        if (hasPan && isNotNameOrDate) {
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
        }
      }
    }

    if (isMissing || formatError) {
      this.invalidFields.add(currentPath);
      this.fieldErrors[currentPath] = formatError || 'This field is required.';
    } else {
      this.invalidFields.delete(currentPath);
      delete this.fieldErrors[currentPath];
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
    Object.keys(this.formData).forEach(key => {
      formDataPayload.append(key, this.formData[key]);
    });
    const entityName = this.currentEntity || this.currentUser?.companyName;
    if (entityName) {
      formDataPayload.append('entityName', entityName);
    }
    Object.keys(this.files).forEach(key => {
      formDataPayload.append(key, this.files[key]);
    });
    Object.keys(this.existingDocs).forEach(key => {
      formDataPayload.append(`${key}_existing`, this.existingDocs[key].fileUrl);
    });

    const apiCall = this.orderId() 
      ? this.api.post<any>(`orders/${this.orderId()}/submit-mca-form`, formDataPayload)
      : this.api.post<any>(`users/me/mca-profile`, formDataPayload);

    apiCall.subscribe({
      next: (res: any) => {
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
            this.success.set(true);
            setTimeout(() => {
              if (this.orderId()) {
                this.router.navigate(['/client/service', this.orderId()]);
              } else {
                this.router.navigate(['/client/compliance']);
              }
            }, 2000);
          }
        } else {
          this.errorMessage.set(res.message || 'Failed to submit form.');
        }
      },
      error: (err: any) => {
        this.submitting.set(false);
        const msg = err.error?.message || err.message || 'Failed to submit form. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }
}
