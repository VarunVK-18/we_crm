import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { AutoFillUtils } from '../../../utils/autofill-utils';

@Component({
  selector: 'app-client-dynamic-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './client-dynamic-form.html',
  styleUrls: ['../forms-shared.css', './client-dynamic-form.css']
})
export class ClientDynamicFormComponent implements OnInit {
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
  private api = inject(Api);
  private draftService = inject(DraftService);
  private confirmDialog = inject(ConfirmDialogService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) this.orderId.set(params['id']);
      if (params['serviceName']) {
        this.serviceName.set(params['serviceName']);
      }
      this.loadData();
    });
  }

  loadData() {
    this.loading.set(true);
    this.errorMessage.set('');

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try { this.currentUser = JSON.parse(savedUser); } catch (e) { }
    }

    // 1. Fetch order details to know exact serviceType and entity
    if (this.orderId()) {
      this.api.get<any>(`checklists/${this.orderId()}`).subscribe({
        next: (orderRes: any) => {
          this.order = orderRes?.checklist || orderRes?.order || orderRes;
          const svcName = this.serviceName() || this.order?.service_name || this.order?.serviceType;
          if (svcName) {
            this.serviceName.set(svcName);
            this.fetchFormSchema(svcName);
          } else {
            this.loading.set(false);
            this.errorMessage.set('Service name not found for this order.');
          }
        },
        error: (err: any) => {
          console.error(err);
          // If order fetch fails, try fetching schema directly by route param
          if (this.serviceName()) {
            this.fetchFormSchema(this.serviceName());
          } else {
            this.loading.set(false);
            this.errorMessage.set('Failed to load order details.');
          }
        }
      });
    } else if (this.serviceName()) {
      this.fetchFormSchema(this.serviceName());
    } else {
      this.loading.set(false);
      this.errorMessage.set('Invalid order or service parameters.');
    }
  }

  fetchFormSchema(serviceName: string) {
    this.api.getFormByServiceName(serviceName).subscribe({
      next: (res: any) => {
        this.schema = res;
        this.initFieldValues(this.schema.fields || [], '');

        // Load any saved draft (which may contain empty strings if saved prematurely)
        this.loadSavedDraft();

        // Auto-fill from profile data if fields are STILL empty after loading draft
        const entityName = this.order?.client_id?.company_name || this.order?.entityName || this.order?.company_name || this.currentUser?.company_name || this.serviceName();
        AutoFillUtils.autoFillWithProfile(this.formData, entityName, this.currentUser, this.api).then(() => {
          this.loading.set(false);
          this.cdr.detectChanges();
        });
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
    if (this.existingDocs[pathKey]) return this.existingDocs[pathKey].split('/').pop() || 'Uploaded Document';
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

    let formattedVal = val || '';

    // 1. PAN / GSTIN / CIN / IFCS / TAN Masking (Force Uppercase)
    if (
      (hasPan && isNotNameOrDate) ||
      lowerName.includes('gstin') || lowerLabel.includes('gstin') || lowerLabel.includes('gst number') ||
      lowerName === 'cin' || lowerLabel.includes('cin') ||
      lowerName.includes('ifsc') || lowerLabel.includes('ifsc') ||
      lowerName.includes('tan') || lowerLabel.includes('tan') ||
      lowerName.includes('lei') || lowerLabel.includes('lei')
    ) {
      formattedVal = formattedVal.toUpperCase();
    }

    // 2. Aadhaar Masking (Force digits only, max 12)
    else if (lowerName.includes('aadhaar') || lowerLabel.includes('aadhaar')) {
      formattedVal = formattedVal.replace(/\D/g, '').substring(0, 12);
    }

    // 3. Phone Masking (Force digits only, max 10)
    else if (field.type === 'phone' || lowerName.includes('phone') || lowerLabel.includes('mobile')) {
      formattedVal = formattedVal.replace(/\D/g, '').substring(0, 10);
    }

    // 4. PIN Code Masking (Force digits only, max 6)
    else if (lowerName.includes('pin') || lowerLabel.includes('pin code') || lowerName.includes('postal')) {
      formattedVal = formattedVal.replace(/\D/g, '').substring(0, 6);
    }

    if (this.formData[path] !== formattedVal) {
      // Small timeout to allow Angular to register the forced change if user typed lowercase/letters
      setTimeout(() => {
        this.formData[path] = formattedVal;
      });
    } else {
      this.formData[path] = formattedVal;
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

        if (f.validation?.regex) {
          const re = new RegExp(f.validation.regex);
          if (!re.test(strVal)) {
            formatError = f.validation.errorMessage || 'Invalid format.';
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
        } else if (/\bname\b|\bfirst\b|\blast\b|\bcompany\b|\bbusiness\b/.test(lowerName) || /\bname\b|\bfirst\b|\blast\b|\bcompany\b|\bbusiness\b/.test(lowerLabel)) {
          if (!lowerName.includes('company') && !lowerLabel.includes('company') && !lowerName.includes('business') && !lowerLabel.includes('business')) {
            if (/\d/.test(strVal)) {
              formatError = 'Name cannot contain numbers.';
            } else if (!/^[a-zA-Z\s\.\-]+$/.test(strVal)) {
              formatError = 'Name can only include alphabets, spaces, dots, or hyphens.';
            }
          } else {
            if (/[^a-zA-Z0-9\s\.\-]/.test(strVal)) {
              formatError = 'Business name cannot contain special characters.';
            } else if (!/^(?=.*[a-zA-Z])/.test(strVal)) {
              formatError = 'Business name must contain at least one letter.';
            }
          }
        } else if (lowerName.includes('place') || lowerLabel.includes('place')) {
          if (/[^a-zA-Z0-9\s\.\-]/.test(strVal)) {
            formatError = 'Place cannot contain special characters.';
          } else if (!/^(?=.*[a-zA-Z])/.test(strVal)) {
            formatError = 'Place must contain at least one letter.';
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
        } else if (lowerName.includes('account') || lowerLabel.includes('account')) {
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

    const payload = new FormData();
    payload.append('dynamicData', JSON.stringify(structuredData));

    // Append files
    Object.keys(this.files).forEach(pathKey => {
      if (this.files[pathKey]) {
        payload.append(pathKey, this.files[pathKey]);
      }
    });

    this.api.post(`orders/${this.orderId()}/submit-dynamic-form`, payload).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        this.success.set(true);
        const draftKey = `DynamicForm_${this.serviceName()}`;
        this.draftService.clearDraft(this.orderId(), draftKey);
        setTimeout(() => {
          this.router.navigate(['/client/ongoing-services']);
        }, 2000);
      },
      error: (err: any) => {
        console.error(err);
        this.submitting.set(false);
        const msg = err.error?.message || err.message || 'Failed to submit form. Please try again.';
        this.errorMessage.set('Error: ' + msg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  closeOcrError() {
    this.ocrErrorTitle = '';
    this.ocrErrorMessage = '';
  }
}
