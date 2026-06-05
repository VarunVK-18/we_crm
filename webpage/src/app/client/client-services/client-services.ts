import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  OfficeIcon, 
  Briefcase01Icon, 
  LicenseIcon, 
  CalculatorIcon, 
  GridIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  UserAccountIcon
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-services',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './client-services.html',
  styleUrl: './client-services.css'
})
export class ClientServicesComponent implements OnInit {
  // Icons
  OfficeIcon = OfficeIcon;
  Briefcase01Icon = Briefcase01Icon;
  LicenseIcon = LicenseIcon;
  CalculatorIcon = CalculatorIcon;
  GridIcon = GridIcon;
  ArrowRight01Icon = ArrowRight01Icon;
  CheckmarkCircle01Icon = CheckmarkCircle01Icon;
  UserAccountIcon = UserAccountIcon;

  categories = [
    { id: 'incorporation', label: 'Incorporation', icon: OfficeIcon },
    { id: 'compliance', label: 'Compliance', icon: Briefcase01Icon },
    { id: 'licensing', label: 'Licensing', icon: LicenseIcon },
    { id: 'tax', label: 'Tax', icon: CalculatorIcon },
    { id: 'other', label: 'Other', icon: GridIcon }
  ];

  servicesDatabase: any = {
    'incorporation': [
      {
        title: 'Proprietorship Registration',
        description: 'Sole vendor formation with business identification.',
        features: ['PAN Card Application', 'MSME/Udyam Registration', 'GST Registration', 'Bank Account Assistance', 'Trade License Support']
      },
      {
        title: 'Partnership Firm Registration',
        description: 'Legal drafting and registration for business partners under Indian Partnership Act.',
        features: ['Drafting Partnership Deed', 'Deed Notarization', 'Firm Registration (ROF)', 'PAN & TAN Application', 'Trade License']
      },
      {
        title: 'Private Limited Incorporation',
        description: 'Full-scale incorporation service including name reservation, DSC, DIN, MOA/AOA.',
        features: ['Name Reservation (RUN)', 'Digital Signature (DSC)', 'Director Identification (DIN)', 'MOA & AOA Drafting', 'Certificate of Incorporation']
      },
      {
        title: 'LLP Incorporation',
        description: 'Statutory compliance for Limited Liability Partnerships.',
        features: ['Form 8 Statement of Account', 'Form 11 Annual Return', 'DIR-3 KYC of Partners', 'Income Tax Return Filing', 'LLP Agreement Maintenance']
      }
    ],
    'compliance': [
      {
        title: 'DPIIT Startup India Certification',
        description: 'Startup India Certification for your startup! Please provide your details correctly.',
        features: ['Govt Subsidy Assistance', 'Tax Exemption Support', 'Priority Sector Lending Support', 'Collateral Free Loan Support', 'IPR Fast Track']
      },
      {
        title: 'MSME Registration',
        description: 'Official Udyam Registration for small and medium enterprises.',
        features: ['Udyam Registration Certificate', 'Priority Sector Lending Support', 'Govt Subsidy Assistance', 'Collateral Free Loan Support', 'ISO Reimbursement Advisory']
      },
      {
        title: 'ISO Certification',
        description: 'Quality management certification.',
        features: ['Process Audit', 'Quality Manual', 'Certification Support', 'Annual Surveillance', 'Training']
      },
      {
        title: 'DUNS Registration',
        description: 'Global business identification number.',
        features: ['DUNS Number Assignment', 'International Credit Credibility', 'Supply Chain Compliance', 'Verified Business Profile', 'Universal Business Language']
      },
      {
        title: 'PAN, TAN & Bank Setup',
        description: 'Basic registrations for new businesses.',
        features: ['PAN Application', 'TAN Registration', 'Bank Account Opening', 'KYC Support', 'Initial Setup']
      }
    ],
    'licensing': [
      {
        title: 'FSSAI Registration',
        description: 'Registration for food business operators, manufacturers, and startups.',
        features: ['Basic/State/Central License', 'Food Safety Audit', 'Premise Inspection Support', 'Renewal Reminders', 'Product Category Mapping']
      },
      {
        title: 'Trademark Registration',
        description: 'Brand protection and IP rights.',
        features: ['Trademark Search', 'Application Filing', 'Objection Handling', 'Hearing Support', 'Registration Certificate']
      }
    ],
    'tax': [
      {
        title: 'GST Onboarding',
        description: 'GST Registration for your business! Thank you for choosing Wealth Empires.',
        features: ['GST Application Filing', 'Document Verification', 'ARN Generation', 'Clarification Support', 'GSTIN Certificate']
      }
    ],
    'other': []
  };

  selectedCategory = signal<string>('incorporation');
  selectedService = signal<any>(null);
  currentServices = signal<any[]>([]);

  // Form State
  quoteForm = {
    name: '',
    phone: '',
    email: '',
    requirements: ''
  };
  formSubmitting = false;
  formSuccess = false;

  ngOnInit() {
    this.selectCategory('incorporation');
  }

  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
    this.currentServices.set(this.servicesDatabase[categoryId] || []);
    
    // Auto-select first service if available
    if (this.currentServices().length > 0) {
      this.selectService(this.currentServices()[0]);
    } else {
      this.selectedService.set(null);
    }
  }

  selectService(service: any) {
    this.selectedService.set(service);
    this.formSuccess = false;
  }

  submitQuote() {
    this.formSubmitting = true;
    // Simulate API call
    setTimeout(() => {
      this.formSubmitting = false;
      this.formSuccess = true;
      this.quoteForm = { name: '', phone: '', email: '', requirements: '' };
    }, 1500);
  }
}
