import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';

@Component({
  selector: 'app-dynamic-forms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dynamic-forms.component.html',
  styleUrls: ['./dynamic-forms.component.css']
})
export class DynamicFormsComponent implements OnInit {
  forms: any[] = [];
  selectedForm: any = null;
  loading: boolean = false;
  saveSuccess: boolean = false;

  availableServices = [
    'Private Limited Incorporation',
    'LLP Incorporation',
    'OPC Incorporation',
    'MSME Registration',
    'Proprietorship Registration',
    'MCA Compliance',
    'TDS Return Filing',
    'PF Registration & Compliance',
    'Trademark Registration',
    'Copyright Registration',
    'Patent Registration',
    'Income Tax Return (ITR)',
    'GST Registration',
    'GST Returns Filing',
    'GST Cancellation',
    'DPIIT Recognition',
    'ISO Certification',
    'FSSAI Registration',
    'DUNS Number',
    'Import Export Code (IEC)',
    'BIS Certification',
    'CE Certification',
    'RoHS Certification',
    'LEI Registration',
    'Digital Signature Certificate (DSC)'
  ];

  fieldTypes = ['text', 'number', 'email', 'phone', 'file', 'dropdown', 'date', 'group', 'array'];

  constructor(private api: Api, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadForms();
  }

  loadForms(showLoading: boolean = true) {
    if (showLoading) {
      this.loading = true;
    }
    this.api.getAllForms().subscribe({
      next: (res: any) => {
        this.forms = res;
        this.loading = false;
        
        // Auto-select the first service by default
        if (!this.selectedForm && this.availableServices.length > 0) {
          this.selectForm(this.availableServices[0]);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.showToast('Failed to load forms from server.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  selectForm(serviceName: string) {
    let form = this.forms.find(f => f.serviceName === serviceName);
    if (form) {
      this.selectedForm = JSON.parse(JSON.stringify(form)); // deep copy for editing
      if (!this.selectedForm.crossValidations) this.selectedForm.crossValidations = [];
      
      // Parse visibility conditions for the visual builder
      const initVisFields = (fields: any[]) => {
        fields.forEach(f => {
          if (f.visibilityCondition && f.visibilityCondition.field && f.visibilityCondition.equals !== undefined) {
            f.visField = f.visibilityCondition.field;
            f.visEquals = f.visibilityCondition.equals;
          }
          if (f.subFields && f.subFields.length > 0) {
            initVisFields(f.subFields);
          }
        });
      };
      if (this.selectedForm.fields) initVisFields(this.selectedForm.fields);

    } else {
      this.selectedForm = {
        serviceName: serviceName,
        title: '',
        subtitle: '',
        fields: [],
        crossValidations: []
      };
    }
  }

  onLabelChange(field: any) {
    if (!field.name || field.name.trim() === '') {
      // Auto-generate camelCase key from label if name is empty
      if (field.label) {
        field.name = field.label
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .split(' ')
          .map((word: string, index: number) => {
            if (index === 0) return word.toLowerCase();
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join('');
      }
    }
  }

  addField(parentFields: any[]) {
    parentFields.push({
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
      subFields: [],
      description: '',
      visField: '',
      visEquals: '',
      showAdvanced: false
    });
  }

  // Simple uncolored confirmation modal state
  deleteModalOpen: boolean = false;
  deleteItemName: string = '';
  deleteAction: (() => void) | null = null;

  promptDeleteField(parentFields: any[], index: number) {
    const field = parentFields[index];
    this.deleteItemName = field?.label?.trim() || field?.name?.trim() || 'this attribute';
    this.deleteAction = () => {
      parentFields.splice(index, 1);
      this.cdr.detectChanges();
    };
    this.deleteModalOpen = true;
    this.cdr.detectChanges();
  }

  promptDeleteCrossValidation(index: number) {
    this.deleteItemName = 'this validation rule';
    this.deleteAction = () => {
      this.selectedForm.crossValidations.splice(index, 1);
      this.cdr.detectChanges();
    };
    this.deleteModalOpen = true;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (this.deleteAction) {
      this.deleteAction();
    }
    this.closeDeleteModal();
    // Auto-save immediately to database so deletion is persisted across App & Web
    this.saveForm();
  }

  closeDeleteModal() {
    this.deleteModalOpen = false;
    this.deleteItemName = '';
    this.deleteAction = null;
    this.cdr.detectChanges();
  }

  removeField(parentFields: any[], index: number) {
    this.promptDeleteField(parentFields, index);
  }

  addDropdownOption(field: any, option: string) {
    if (option && option.trim() !== '') {
      if (!field.options) field.options = [];
      field.options.push(option.trim());
    }
  }

  removeDropdownOption(field: any, index: number) {
    field.options.splice(index, 1);
  }

  addCrossValidation() {
    if (!this.selectedForm.crossValidations) this.selectedForm.crossValidations = [];
    this.selectedForm.crossValidations.push({
      type: 'sumEquals',
      fieldsStr: '',
      value: '',
      message: ''
    });
  }

  removeCrossValidation(index: number) {
    this.promptDeleteCrossValidation(index);
  }

  // Helper to extract a flattened list of field names for the condition builder
  getAvailableFields(fields: any[] = this.selectedForm?.fields || []): string[] {
    let names: string[] = [];
    fields.forEach(f => {
      if (f.name) names.push(f.name);
      if (f.subFields && f.subFields.length > 0) {
        names = names.concat(this.getAvailableFields(f.subFields));
      }
    });
    return names;
  }

  saveForm() {
    if (!this.selectedForm || !this.selectedForm.serviceName) {
      return;
    }
    if (!this.selectedForm.title) {
      this.selectedForm.title = this.selectedForm.serviceName;
    }

    // Automatically prune any empty un-labeled fields
    const pruneEmptyFields = (fields: any[]) => {
      for (let i = fields.length - 1; i >= 0; i--) {
        const f = fields[i];
        if (f.subFields && f.subFields.length > 0) {
          pruneEmptyFields(f.subFields);
        }
        if (!f.label || f.label.trim() === '') {
          if (f.type !== 'group' && (!f.subFields || f.subFields.length === 0)) {
            fields.splice(i, 1);
          }
        }
      }
    };
    if (this.selectedForm.fields) {
      pruneEmptyFields(this.selectedForm.fields);
    }

    let hasEmptyLabel = false;
    const checkLabels = (fields: any[]) => {
      fields.forEach(f => {
        if (!f.label || f.label.trim() === '') {
          hasEmptyLabel = true;
        }
        if (!f.name || f.name.trim() === '') {
          if (f.label && f.label.trim() !== '') {
            f.name = f.label.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').map((w: string, i: number) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
          }
        }
        if (f.subFields && f.subFields.length > 0) {
          checkLabels(f.subFields);
        }
      });
    };
    if (this.selectedForm.fields) {
      checkLabels(this.selectedForm.fields);
    }

    if (hasEmptyLabel) {
      this.showToast('Please provide a Display Label for all fields and sub-fields.', 'error');
      return;
    }

    // Helper to format fields for backend
    const formatFields = (fields: any[]) => {
      fields.forEach(f => {
        // Construct JSON visibility object from visual UI inputs
        if (f.visField && f.visField.trim() !== '' && f.visEquals !== undefined && f.visEquals.trim() !== '') {
          f.visibilityCondition = {
            field: f.visField.trim(),
            equals: f.visEquals.trim()
          };
        } else {
          delete f.visibilityCondition;
        }

        // Clean up UI-only properties
        delete f.visField;
        delete f.visEquals;
        delete f.showAdvanced;
        delete f.visibilityConditionStr;

        if (f.type === 'array' && !f.arrayConfig) {
          f.arrayConfig = {};
        }
        if (f.subFields && f.subFields.length > 0) {
          formatFields(f.subFields);
        } else if (f.type !== 'group' && f.type !== 'array') {
          delete f.subFields;
        }
      });
    };

    const payload = JSON.parse(JSON.stringify(this.selectedForm));
    formatFields(payload.fields);

    if (payload.crossValidations) {
      payload.crossValidations.forEach((cv: any) => {
        if (cv.fieldsStr) {
          cv.fields = cv.fieldsStr.split(',').map((s: string) => s.trim());
        }
        if (typeof cv.value === 'string' && !isNaN(Number(cv.value))) {
          cv.value = Number(cv.value);
        }
      });
    }

    this.loading = true;
    this.saveSuccess = false;
    this.cdr.detectChanges();

    this.api.upsertForm(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.saveSuccess = true;
        this.showToast('Form schema saved successfully!', 'success');
        this.loadForms(false);
        setTimeout(() => {
          this.saveSuccess = false;
          this.cdr.detectChanges();
        }, 3500);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.saveSuccess = false;
        const msg = err.error?.details || err.error?.error || err.message || 'Failed to save form schema.';
        this.showToast('Error: ' + msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  toastMsg: string = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  showToast(msg: string, type: 'success' | 'error') {
    this.toastMsg = msg;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.cdr.detectChanges();
    this.toastTimeout = setTimeout(() => {
      this.toastMsg = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}
