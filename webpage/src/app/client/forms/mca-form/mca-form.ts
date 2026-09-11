import { Component, OnInit, signal, inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
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
export class McaFormComponent implements OnInit {
  @Input() isEmbedded = false;
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
    const entityName = this.currentUser?.companyName || 'All Entities';
    this.api.get<any>(`entity-profile?entityName=${encodeURIComponent(entityName)}`).subscribe({
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

  async submitForm() {
    // 1. Validate required fields
    const missingFields: string[] = [];
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
        } else if (f.required) {
          if (f.type === 'file') {
            if (!this.files[currentPath] && !this.existingDocs[currentPath]) {
              missingFields.push(f.label || f.name);
            }
          } else if (f.type === 'checkbox') {
            if (!this.formData[currentPath]) {
              missingFields.push(f.label || f.name);
            }
          } else {
            const val = this.formData[currentPath];
            if (val === undefined || val === null || String(val).trim() === '') {
              missingFields.push(f.label || f.name);
            }
          }
        }
      });
    };

    if (this.schema?.fields) {
      checkRequired(this.schema.fields, '');
    }

    if (missingFields.length > 0) {
      this.errorMessage.set(`Please complete all required fields: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (this.currentUser?.companyName) {
      formDataPayload.append('entityName', this.currentUser.companyName);
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
          this.success.set(true);
          if (this.orderId()) {
            this.draftService.clearDraft(this.orderId(), `DynamicForm_${this.serviceName()}`);
          }
          if (this.isEmbedded) {
            setTimeout(() => {
              this.formCompleted.emit();
            }, 1000);
          } else {
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
