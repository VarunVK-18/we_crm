import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Api } from '../../api';
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
    { id: 'ip', label: 'IP', icon: CheckmarkCircle01Icon },
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
    'ip': [
      {
        title: 'Trademark Registration',
        description: 'Brand protection and IP rights.',
        features: ['Trademark Search', 'Application Filing', 'Objection Handling', 'Hearing Support', 'Registration Certificate']
      },
      {
        title: 'Copyright Registration',
        description: 'Protect your original creative work from unauthorized use.',
        features: ['Copyright Filing', 'Objection Reply', 'Registration Certificate', 'Infringement Protection', 'Global Recognition']
      },
      {
        title: 'Patent Registration',
        description: 'Exclusive rights for your inventions and intellectual property.',
        features: ['Prior Art Search', 'Patent Drafting', 'Filing Application', 'Examination Report Reply', 'Grant of Patent']
      }
    ],
    'licensing': [
      {
        title: 'FSSAI Registration',
        description: 'Registration for food business operators, manufacturers, and startups.',
        features: ['Basic/State/Central License', 'Food Safety Audit', 'Premise Inspection Support', 'Renewal Reminders', 'Product Category Mapping']
      }
    ],
    'tax': [
      {
        title: 'GST Onboarding',
        description: 'GST Registration for your business! Thank you for choosing Wealth Empires.',
        features: ['GST Application Filing', 'Document Verification', 'ARN Generation', 'Clarification Support', 'GSTIN Certificate']
      }
    ],
    'other': [
      {
        title: 'Individual DSC',
        description: 'Class 3 Digital Signature Certificate for Individuals.',
        features: ['Identity Verification', 'Digital Signature Creation', 'USB Token', 'Validity 2 Years', 'Technical Support']
      },
      {
        title: 'Organization DSC',
        description: 'Class 3 Digital Signature Certificate for Organizations.',
        features: ['Organization Verification', 'Digital Signature Creation', 'USB Token', 'Validity 2 Years', 'Technical Support']
      }
    ]
  };

  user = signal<any>(null);
  selectedCategory = signal<string>('incorporation');
  selectedService = signal<any>(null);
  currentServices = signal<any[]>([]);
  clientManager = signal<any>(null);

  // Form State
  quoteForm = {
    name: '',
    phone: '',
    email: '',
    requirements: ''
  };
  formSubmitting = signal<boolean>(false);
  formSuccess = signal<boolean>(false);

  constructor(private api: Api, private route: ActivatedRoute) {}

  ngOnInit() {
    this.selectCategory('incorporation');
    
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectCategory(params['category']);
      }
    });

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.user.set(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }

    this.fetchClientManager();
  }

  fetchClientManager() {
    const userVal = this.user();
    if (!userVal) return;
    const uid = userVal._id || userVal.id;
    if (!uid) return;

    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res) => {
        if (res.user && res.user.assigned_to) {
          this.clientManager.set(res.user.assigned_to);
        }
      },
      error: (err) => console.error('Failed to fetch client manager:', err)
    });
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
    this.formSuccess.set(false);
  }

  submitQuote() {
    this.formSubmitting.set(true);
    
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) {
      alert('User not found.');
      this.formSubmitting.set(false);
      return;
    }

    const serviceName = this.selectedService()?.title;
    if (!serviceName) {
      alert('Service not selected.');
      this.formSubmitting.set(false);
      return;
    }

    const formData = new FormData();
    formData.append('serviceName', serviceName);
    formData.append('owner_name', this.quoteForm.name || this.user()?.owner_name || '');
    formData.append('phone', this.quoteForm.phone || this.user()?.phone || '');
    formData.append('email', this.quoteForm.email || this.user()?.email || '');

    const details = {
      Status: 'Pending Client Form Submission',
      'Next Step': 'Assign expert to unlock form for client',
      Requirements: this.quoteForm.requirements
    };
    formData.append('details', JSON.stringify(details));

    this.api.post<any>(`users/profile/${uid}/subscribe-service`, formData).subscribe({
      next: (res) => {
        this.formSubmitting.set(false);
        if (res && res.success) {
          this.formSuccess.set(true);
          this.quoteForm = { name: '', phone: '', email: '', requirements: '' };
        } else {
          alert('Failed to submit quote request.');
        }
      },
      error: (err) => {
        this.formSubmitting.set(false);
        alert(err.error?.message || 'Failed to submit quote request.');
      }
    });
  }
}
