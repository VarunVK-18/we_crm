import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-settings.html',
  styleUrl: './system-settings.css'
})
export class SystemSettings implements OnInit {
  user = signal<any>(null);
  settings = signal<any>({
    default_filing_tax: 18,
    allow_agent_registration: true,
    require_document_verification: true,
    enable_document_extraction: false
  });

  activeTab = signal<string>('system');

  availableServices = [
    '360° Compliance',
    'Trademark Registration',
    'Company Incorporation',
    'Accounting & Tax',
    'GST Onboarding',
    'Strategic Tax Planning',
    'ISO Certifications',
    'Capital Funding',
    'Risk Management',
    'Compliance Audit',
    'MCA Compliance Package (Private Ltd)',
    'GST Compliance Package',
    'MCA Compliance Package (LLP)',
    'Proprietorship Registration',
    'Partnership Firm Registration',
    'IEC Code Registration',
    'Comprehensive MCA + GST + TDS',
    'FSSAI Food License',
    'MSME Certification',
    'DUNS Number Registration',
    'TAX filing',
    'TAX Planning',
    'GST Services',
    'Private Limited Incorporation',
    'LLP Incorporation',
    'PAN, TAN & Bamk Setup'
  ];

  selectedService = '';
  activeTemplateItems: {title: string, description: string}[] = [];
  activeTemplateExtractEnabled = false;
  newItemTitle = '';
  newItemDesc = '';

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchSettings();
  }

  fetchSettings() {
    this.api.get<any>('settings').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.settings.set(res.settings);
        }
      },
      error: (err) => {
        console.error('Failed to fetch settings:', err);
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
      },
      error: (err) => console.error('Failed to fetch templates:', err)
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
}
