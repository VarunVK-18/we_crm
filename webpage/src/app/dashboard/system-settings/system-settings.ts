import { Component, OnInit, signal, computed, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './system-settings.html',
  styleUrl: './system-settings.css'
})
export class SystemSettings implements OnInit {
  isLoading = signal<boolean>(true);
  isTemplateLoading = signal<boolean>(false);
  user = signal<any>(null);
  settings = signal<any>({
    default_filing_tax: 18,
    gst_percentage: 18,
    cgst_percentage: 9,
    allow_agent_registration: true,
    require_document_verification: true,
    enable_document_extraction: false,
    require_payment_verification: true,
    bank_details: {
      savings_account_last_four: '',
      current_account_last_four: '',
      savings_upi_id: '',
      current_upi_id: '',
      add_gst_savings: false,
      add_gst_current: false,
      add_gst_savings_upi: false,
      add_gst_current_upi: false
    }
  });

  activeTab = signal<string>('system');
  searchQuery = signal<string>('');
  mappedTemplateIds = signal<string[]>([]);

  filteredServices = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.availableServices;
    return this.availableServices.filter(s => s.toLowerCase().includes(q));
  });

  availableServices = [
    '360° Compliance',
    'Accounting & Tax',
    'BIS',
    'Capital Funding',
    'Company Incorporation',
    'Compliance Audit',
    'Comprehensive MCA + GST + TDS',
    'Copyright',
    'DPIIT',
    'DSC',
    'DUNS Number Registration',
    'FSSAI',
    'FSSAI Food License',
    'GST Cancelation',
    'GST Compliance',
    'GST Compliance Package',
    'GST filing',
    'GST Onboarding',
    'GST Registration',
    'GST Services',
    'IE code',
    'IEC Code Registration',
    'ISO',
    'ISO Certifications',
    'ITR',
    'LEI',
    'LLP Incorporation',
    'MCA Compliance',
    'MCA Compliance Package (LLP)',
    'MCA Compliance Package (Private Ltd)',
    'MSME',
    'MSME Certification',
    'OPC',
    'PAN, TAN & Bamk Setup',
    'Partnership Firm Registration',
    'Patent',
    'PF',
    'Private Limited Incorporation',
    'Proprietorship',
    'Proprietorship Registration',
    'Risk Management',
    'ROSH & CE',
    'Strategic Tax Planning',
    'TAX filing',
    'TAX Planning',
    'TDS',
    'Trade Mark',
    'Trademark Registration'
  ];

  selectedService = '';
  activeTemplateItems: any[] = [];
  activeTemplateExtractEnabled = false;
  activeTemplateNeedTemporary = false;
  newItemTitle = '';
  newItemDesc = '';
  newItemGetBill = false;
  newItemNeedTemporary = false;
  newItemHasCustomInput = false;
  newItemCustomInputLabel = '';
  newItemLinkedTemplates: string[] = [];

  calendarYear = '2026-2027';
  calendarFile: File | null = null;
  isUploadingCalendar = false;
  isCalendarUploaded = false;

  sopFile: File | null = null;
  isUploadingSop = false;
  activeTemplateSop = signal<{filename: string, _id: string} | null>(null);

  constructor(private api: Api, private sanitizer: DomSanitizer) {}

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchSettings();
    this.fetchLatestCalendar();
    this.fetchDocTemplates();
  }

  fetchLatestCalendar() {
    this.api.get<any>('calendar/latest').subscribe({
      next: (res) => {
        if (res && res.calendar) {
          this.calendarYear = res.calendar.year;
          this.isCalendarUploaded = true;
        } else {
          this.isCalendarUploaded = false;
        }
      },
      error: () => {
        this.isCalendarUploaded = false;
      }
    });
  }

  fetchSettings() {
    this.isLoading.set(true);
    this.api.get<any>('settings').subscribe({
      next: (res) => {
        if (res && res.success) {
          const fetchedSettings = res.settings || {};
          if (res.company) {
            fetchedSettings.company_name = res.company.company_name || '';
            fetchedSettings.gstin = res.company.gstin || '';
            fetchedSettings.phone = res.company.phone || '';
            fetchedSettings.address = res.company.address || '';
          }
          if (!fetchedSettings.bank_details) {
            fetchedSettings.bank_details = {
              savings_account_last_four: '',
              current_account_last_four: '',
              savings_upi_id: '',
              current_upi_id: '',
              add_gst_savings: false,
              add_gst_current: false,
              add_gst_savings_upi: false,
              add_gst_current_upi: false
            };
          }
          this.settings.set(fetchedSettings);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch settings:', err);
        this.isLoading.set(false);
      }
    });
  }

  saveSettings() {
    this.api.post<any>('settings', this.settings()).subscribe({
      next: (res) => {
        alert('Settings saved successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to save settings.');
      }
    });
  }

  onGstChange(val: number) {
    if (val !== undefined && val !== null) {
      this.settings.update(s => ({
        ...s,
        gst_percentage: val,
        cgst_percentage: val / 2
      }));
    }
  }

  switchTab(tabName: string) {
    this.activeTab.set(tabName);
    if (tabName === 'doc-templates') {
      this.fetchDocTemplates();
    } else if (tabName !== 'system') {
      this.selectedService = tabName;
      this.onServiceChange();
    }
  }

  onServiceChange() {
    this.activeTemplateItems = [];
    this.activeTemplateExtractEnabled = false;
    this.mappedTemplateIds.set([]);
    
    if (!this.selectedService) {
      return;
    }
    this.isTemplateLoading.set(true);
    this.api.get<any>('templates/checklists').subscribe({
      next: (res) => {
        if (res && res.success) {
          const tmpl = res.templates.find((t: any) => t.service_name === this.selectedService);
          if (tmpl) {
            this.activeTemplateItems = (tmpl.items || []).map((i: any) => ({ 
              title: i.title, 
              description: i.description,
              getBill: i.getBill || false,
              need_temporary: i.need_temporary || false,
              has_custom_input: i.has_custom_input || false,
              custom_input_label: i.custom_input_label || '',
              linked_document_templates: (i.linked_document_templates || []).map((dt: any) => dt._id || dt)
            }));
            this.activeTemplateExtractEnabled = !!tmpl.enable_document_extraction;
            this.activeTemplateNeedTemporary = !!tmpl.need_temporary;
            this.activeTemplateSop.set(tmpl.sop_document || null);
            this.mappedTemplateIds.set((tmpl.document_templates || []).map((dt: any) => dt._id || dt));
          } else {
            this.activeTemplateItems = [];
            this.activeTemplateExtractEnabled = false;
            this.activeTemplateNeedTemporary = false;
            this.activeTemplateSop.set(null);
            this.mappedTemplateIds.set([]);
          }
        }
        this.isTemplateLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch templates:', err);
        this.isTemplateLoading.set(false);
      }
    });
  }

  addTemplateItem() {
    if (this.newItemTitle.trim()) {
      this.activeTemplateItems.push({
        title: this.newItemTitle.trim(),
        description: this.newItemDesc.trim(),
        getBill: this.newItemGetBill,
        need_temporary: this.newItemNeedTemporary,
        has_custom_input: this.newItemHasCustomInput,
        custom_input_label: this.newItemCustomInputLabel.trim(),
        linked_document_templates: [...this.newItemLinkedTemplates]
      });
      this.newItemTitle = '';
      this.newItemDesc = '';
      this.newItemGetBill = false;
      this.newItemNeedTemporary = false;
      this.newItemHasCustomInput = false;
      this.newItemCustomInputLabel = '';
      this.newItemLinkedTemplates = [];
    }
  }

  removeTemplateItem(index: number) {
    this.activeTemplateItems.splice(index, 1);
  }

  startEditing(index: number) {
    const item = this.activeTemplateItems[index];
    item.isEditing = true;
    item.oldTitle = item.title;
    item.editTitle = item.title;
    item.editDesc = item.description;
    item.editGetBill = item.getBill || false;
    item.editNeedTemporary = item.need_temporary || false;
    item.editHasCustomInput = item.has_custom_input || false;
    item.editCustomInputLabel = item.custom_input_label || '';
    item.editLinkedTemplates = [...(item.linked_document_templates || [])];
  }

  saveEdit(index: number) {
    const item = this.activeTemplateItems[index];
    item.title = item.editTitle;
    item.description = item.editDesc;
    item.getBill = item.editGetBill;
    item.need_temporary = item.editNeedTemporary || false;
    item.has_custom_input = item.editHasCustomInput || false;
    item.custom_input_label = item.editCustomInputLabel || '';
    item.linked_document_templates = [...(item.editLinkedTemplates || [])];
    item.isEditing = false;
  }

  cancelEdit(index: number) {
    this.activeTemplateItems[index].isEditing = false;
  }

  saveTemplate() {
    if (!this.selectedService) return;
    
    // Clean up temporary editing properties before saving
    const cleanItems = this.activeTemplateItems.map(item => ({
      title: item.title,
      description: item.description,
      getBill: item.getBill || false,
      need_temporary: item.need_temporary || false,
      has_custom_input: item.has_custom_input || false,
      custom_input_label: item.custom_input_label || '',
      linked_document_templates: item.linked_document_templates || [],
      oldTitle: item.oldTitle
    }));

    this.api.post<any>('templates/checklists', {
      service_name: this.selectedService,
      items: cleanItems,
      enable_document_extraction: this.activeTemplateExtractEnabled,
      document_templates: this.mappedTemplateIds(),
      need_temporary: this.activeTemplateNeedTemporary
    }).subscribe({
      next: (res) => {
        alert('Template saved successfully!');
        // Clear oldTitle after successful save to reset state
        this.activeTemplateItems.forEach(item => delete item.oldTitle);
      },
      error: (err) => alert(err.error?.message || 'Failed to save template.')
    });
  }

  isTemplateMapped(id: string): boolean {
    return this.mappedTemplateIds().includes(id);
  }

  toggleTemplateMapping(id: string) {
    const current = this.mappedTemplateIds();
    if (current.includes(id)) {
      this.mappedTemplateIds.set(current.filter(x => x !== id));
    } else {
      this.mappedTemplateIds.set([...current, id]);
    }
  }

  getLinkedTemplateName(id: string): string {
    if (!id) return '';
    const templates = this.docTemplates();
    const found = templates.find(t => t._id === id);
    return found ? found.name : '';
  }

  isItemTemplateMapped(item: any, tmplId: string, isEditingMode: boolean): boolean {
    const list = isEditingMode ? item.editLinkedTemplates : item.linked_document_templates;
    return (list || []).includes(tmplId);
  }

  toggleItemTemplateMapping(item: any, tmplId: string, isEditingMode: boolean) {
    if (isEditingMode) {
      if (!item.editLinkedTemplates) item.editLinkedTemplates = [];
      if (item.editLinkedTemplates.includes(tmplId)) {
        item.editLinkedTemplates = item.editLinkedTemplates.filter((x: string) => x !== tmplId);
      } else {
        item.editLinkedTemplates = [...item.editLinkedTemplates, tmplId];
      }
    } else {
      if (!item.linked_document_templates) item.linked_document_templates = [];
      if (item.linked_document_templates.includes(tmplId)) {
        item.linked_document_templates = item.linked_document_templates.filter((x: string) => x !== tmplId);
      } else {
        item.linked_document_templates = [...item.linked_document_templates, tmplId];
      }
    }
  }

  isNewItemTemplateMapped(tmplId: string): boolean {
    return this.newItemLinkedTemplates.includes(tmplId);
  }

  toggleNewItemTemplateMapping(tmplId: string) {
    if (this.newItemLinkedTemplates.includes(tmplId)) {
      this.newItemLinkedTemplates = this.newItemLinkedTemplates.filter(x => x !== tmplId);
    } else {
      this.newItemLinkedTemplates = [...this.newItemLinkedTemplates, tmplId];
    }
  }

  getLinkedTemplatesSummary(templateIds: string[]): string {
    if (!templateIds || templateIds.length === 0) return 'None';
    const templates = this.docTemplates();
    return templateIds.map(id => {
      const found = templates.find(t => t._id === id);
      return found ? found.name : '';
    }).filter(name => !!name).join(', ');
  }

  onCalendarFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.calendarFile = event.target.files[0];
    }
  }

  uploadComplianceCalendar() {
    if (!this.calendarFile || !this.calendarYear) return;
    this.isUploadingCalendar = true;
    
    const formData = new FormData();
    formData.append('year', this.calendarYear);
    formData.append('file', this.calendarFile);

    this.api.post<any>('calendar/upload', formData).subscribe({
      next: (res) => {
        this.isUploadingCalendar = false;
        this.isCalendarUploaded = true;
        alert('Compliance Calendar uploaded successfully!');
        this.calendarFile = null;
      },
      error: (err) => {
        this.isUploadingCalendar = false;
        alert(err.error?.message || 'Failed to upload calendar.');
      }
    });
  }

  deleteComplianceCalendar() {
    if (!this.calendarYear) {
      alert('Please enter a Financial Year to delete its calendar.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the Compliance Calendar for ${this.calendarYear}?`)) return;

    const encodedYear = encodeURIComponent(this.calendarYear.trim());
    this.api.delete<any>(`calendar/${encodedYear}`).subscribe({
      next: (res) => {
        this.isCalendarUploaded = false;
        alert('Compliance Calendar deleted successfully!');
      },
      error: (err) => {
        console.error('Delete Calendar Error:', err);
        const errMsg = err.error?.message || err.message || 'Failed to delete calendar.';
        alert(errMsg);
      }
    });
  }

  onSopFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.sopFile = event.target.files[0];
    }
  }

  uploadSop() {
    if (!this.sopFile || !this.selectedService) return;
    this.isUploadingSop = true;
    
    const formData = new FormData();
    formData.append('sop', this.sopFile);

    this.api.post<any>(`templates/checklists/${encodeURIComponent(this.selectedService)}/sop`, formData).subscribe({
      next: (res) => {
        this.isUploadingSop = false;
        if (res.success && res.sop_document) {
          this.activeTemplateSop.set(res.sop_document);
          alert('SOP uploaded successfully!');
        }
        this.sopFile = null;
      },
      error: (err) => {
        this.isUploadingSop = false;
        alert(err.error?.message || 'Failed to upload SOP.');
      }
    });
  }

  // ─── Document Template State ──────────────────────────────────────────────

  docTemplates = signal<any[]>([]);
  isDocTemplateLoading = signal<boolean>(false);
  showDocTemplateModal = signal<boolean>(false);
  showDocTemplatePreview = signal<boolean>(false);
  previewingDocTemplate = signal<any>(null);
  isSavingDocTemplate = signal<boolean>(false);
  editorHtml = signal<string>('');

  editingDocTemplate: any = { name: '', description: '', html_content: '' };

  availablePlaceholders = [
    { token: '{{client_name}}', label: 'Client Name' },
    { token: '{{company_name}}', label: 'Company Name' },
    { token: '{{email}}', label: 'Email' },
    { token: '{{phone}}', label: 'Phone' },
    { token: '{{address}}', label: 'Address' },
    { token: '{{pan}}', label: 'PAN' },
    { token: '{{gstin}}', label: 'GSTIN' },
    { token: '{{cin}}', label: 'CIN' },
    { token: '{{tan}}', label: 'TAN' },
    { token: '{{director_count}}', label: 'Director Count' },
    { token: '{{director_name}}', label: 'Director Name(s)' },
    { token: '{{din_number}}', label: 'DIN Number(s)' },
    { token: '{{business_type}}', label: 'Business Type' },
    { token: '{{service_name}}', label: 'Service Name' },
    { token: '{{service_id}}', label: 'Service ID' },
    { token: '{{today_date}}', label: 'Today\'s Date' },
    { token: '{{company_letterhead}}', label: 'Our Company Name' },
    { token: '{{input:Label Name}}', label: 'Custom Input (Modify Label Name)' },
  ];

  fetchDocTemplates() {
    this.isDocTemplateLoading.set(true);
    this.api.get<any>('document-templates').subscribe({
      next: (res) => {
        this.docTemplates.set(res.templates || []);
        this.isDocTemplateLoading.set(false);
      },
      error: () => this.isDocTemplateLoading.set(false)
    });
  }

  openDocTemplateModal(tmpl: any) {
    if (tmpl) {
      this.editingDocTemplate = { ...tmpl };
      this.editorHtml.set(tmpl.html_content || '');
    } else {
      this.editingDocTemplate = { name: '', description: '', html_content: '' };
      this.editorHtml.set('');
    }
    this.showDocTemplateModal.set(true);
    // Set editor content after DOM renders
    setTimeout(() => {
      const el = document.getElementById('doc-template-editor');
      if (el) el.innerHTML = this.editorHtml();
    }, 100);
  }

  closeDocTemplateModal() {
    this.showDocTemplateModal.set(false);
  }

  onEditorInput(event: Event) {
    const el = event.target as HTMLElement;
    this.editingDocTemplate.html_content = el.innerHTML;
  }

  editorCmd(command: string) {
    document.execCommand(command, false, undefined);
    const el = document.getElementById('doc-template-editor');
    if (el) this.editingDocTemplate.html_content = el.innerHTML;
  }

  editorFontSize(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    document.execCommand('fontSize', false, val);
    const el = document.getElementById('doc-template-editor');
    if (el) this.editingDocTemplate.html_content = el.innerHTML;
  }

  insertPlaceholder(event: Event) {
    const token = (event.target as HTMLSelectElement).value;
    if (!token) return;
    (event.target as HTMLSelectElement).value = '';
    document.getElementById('doc-template-editor')?.focus();
    document.execCommand('insertText', false, token);
    const el = document.getElementById('doc-template-editor');
    if (el) this.editingDocTemplate.html_content = el.innerHTML;
  }

  copyPlaceholder(token: string) {
    navigator.clipboard.writeText(token).then(() => {
      alert(`Copied: ${token}`);
    });
  }

  saveDocTemplate() {
    if (!this.editingDocTemplate.name) {
      alert('Template name is required.');
      return;
    }
    const el = document.getElementById('doc-template-editor');
    if (el) this.editingDocTemplate.html_content = el.innerHTML;

    if (!this.editingDocTemplate.html_content || this.editingDocTemplate.html_content.trim() === '') {
      alert('Template content cannot be empty.');
      return;
    }
    this.isSavingDocTemplate.set(true);

    const payload = {
      name: this.editingDocTemplate.name,
      description: this.editingDocTemplate.description,
      html_content: this.editingDocTemplate.html_content
    };

    const req$ = this.editingDocTemplate._id
      ? this.api.put<any>(`document-templates/${this.editingDocTemplate._id}`, payload)
      : this.api.post<any>('document-templates', payload);

    req$.subscribe({
      next: (res) => {
        this.isSavingDocTemplate.set(false);
        this.closeDocTemplateModal();
        this.fetchDocTemplates();
      },
      error: (err) => {
        this.isSavingDocTemplate.set(false);
        alert(err.error?.message || 'Failed to save template.');
      }
    });
  }

  deleteDocTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template? This cannot be undone.')) return;
    this.api.delete<any>(`document-templates/${id}`).subscribe({
      next: () => this.fetchDocTemplates(),
      error: (err) => alert(err.error?.message || 'Failed to delete template.')
    });
  }

  previewDocTemplate(tmpl: any) {
    this.previewingDocTemplate.set(tmpl);
    this.showDocTemplatePreview.set(true);
  }
}
