import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  activeTemplateItems: {title: string, description: string}[] = [];
  activeTemplateExtractEnabled = false;
  newItemTitle = '';
  newItemDesc = '';

  calendarYear = '2026-2027';
  calendarFile: File | null = null;
  isUploadingCalendar = false;

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchSettings();
  }

  fetchSettings() {
    this.isLoading.set(true);
    this.api.get<any>('settings').subscribe({
      next: (res) => {
        if (res && res.success) {
          const fetchedSettings = res.settings || {};
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
    if (tabName !== 'system') {
      this.selectedService = tabName;
      this.onServiceChange();
    }
  }

  onServiceChange() {
    this.activeTemplateItems = [];
    this.activeTemplateExtractEnabled = false;
    
    if (!this.selectedService) {
      return;
    }
    this.isTemplateLoading.set(true);
    this.api.get<any>('templates/checklists').subscribe({
      next: (res) => {
        if (res && res.success) {
          const tmpl = res.templates.find((t: any) => t.service_name === this.selectedService);
          if (tmpl) {
            this.activeTemplateItems = (tmpl.items || []).map((i: any) => ({ title: i.title, description: i.description }));
            this.activeTemplateExtractEnabled = !!tmpl.enable_document_extraction;
          } else {
            this.activeTemplateItems = [];
            this.activeTemplateExtractEnabled = false;
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
        description: this.newItemDesc.trim()
      });
      this.newItemTitle = '';
      this.newItemDesc = '';
    }
  }

  removeTemplateItem(index: number) {
    this.activeTemplateItems.splice(index, 1);
  }

  saveTemplate() {
    if (!this.selectedService) return;
    this.api.post<any>('templates/checklists', {
      service_name: this.selectedService,
      items: this.activeTemplateItems,
      enable_document_extraction: this.activeTemplateExtractEnabled
    }).subscribe({
      next: (res) => alert('Template saved successfully!'),
      error: (err) => alert(err.error?.message || 'Failed to save template.')
    });
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
        alert('Compliance Calendar uploaded successfully!');
        this.calendarFile = null;
      },
      error: (err) => {
        this.isUploadingCalendar = false;
        alert(err.error?.message || 'Failed to upload calendar.');
      }
    });
  }
}
