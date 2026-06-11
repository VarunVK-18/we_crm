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
  UserAccountIcon,
  Call02Icon,
  MailOpenIcon
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
  Call02Icon = Call02Icon;
  MailOpenIcon = MailOpenIcon;

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
        features: ['PAN Card Application', 'MSME/Udyam Registration', 'GST Registration', 'Bank Account Assistance', 'Trade License Support', 'Processing Time: 5-7 business days']
      },
      {
        title: 'Partnership Firm Registration',
        description: 'Legal drafting and registration for business partners under Indian Partnership Act.',
        features: ['Drafting Partnership Deed', 'Deed Notarization', 'Firm Registration (ROF)', 'PAN & TAN Application', 'Trade License', 'Processing Time: 5-7 business days']
      },
      {
        title: 'Private Limited Incorporation',
        description: 'Full-scale incorporation service including name reservation, DSC, DIN, MOA/AOA.',
        features: ['Name Reservation (RUN)', 'Digital Signature (DSC)', 'Director Identification (DIN)', 'MOA & AOA Drafting', 'Certificate of Incorporation', 'Processing Time: 5-7 business days']
      },
      {
        title: 'LLP Incorporation',
        description: 'Statutory compliance for Limited Liability Partnerships.',
        features: ['Form 8 Statement of Account', 'Form 11 Annual Return', 'DIR-3 KYC of Partners', 'Income Tax Return Filing', 'LLP Agreement Maintenance', 'Processing Time: 5-7 business days']
      },
      {
        title: 'OPC',
        description: 'One Person Company registration for solo entrepreneurs.',
        features: ['Name Reservation', 'DSC & DIN', 'MOA & AOA Drafting', 'Certificate of Incorporation', 'Bank Setup Support', 'Processing Time: 5-7 business days']
      },
      {
        title: 'MSME Registration',
        description: 'Official Udyam Registration for small and medium enterprises.',
        features: ['Udyam Registration Certificate', 'Priority Sector Lending Support', 'Govt Subsidy Assistance', 'Collateral Free Loan Support', 'ISO Reimbursement Advisory', 'Processing Time: 5-7 business days']
      }
    ],
    'compliance': [
      {
        title: 'MCA Compliance',
        description: 'Annual return filings and MCA statutory compliance.',
        features: ['AOC-4 & MGT-7 Filing', 'Director KYC', 'Statutory Audit Support', 'Minutes of Meeting', 'Event Based Filings', 'Processing Time: 5-7 business days']
      },
      {
        title: 'TDS',
        description: 'TDS return filing and certificate issuance.',
        features: ['TDS Computation', 'Quarterly Return Filing', 'Form 16/16A Generation', 'Challan Payment', 'Notice Reply', 'Processing Time: 5-7 business days']
      },
      {
        title: 'PF',
        description: 'Provident Fund registration and monthly compliance.',
        features: ['PF Registration', 'Monthly ECR Filing', 'Challan Generation', 'Employee Addition/Deletion', 'KYC Updates', 'Processing Time: 5-7 business days']
      },
      {
        title: 'DUNS Registration',
        description: 'Global business identification number.',
        features: ['DUNS Number Assignment', 'International Credit Credibility', 'Supply Chain Compliance', 'Verified Business Profile', 'Universal Business Language', 'Processing Time: 5-7 business days']
      },
      {
        title: 'PAN, TAN & Bank Setup',
        description: 'Basic registrations for new businesses.',
        features: ['PAN Application', 'TAN Registration', 'Bank Account Opening', 'KYC Support', 'Initial Setup', 'Processing Time: 5-7 business days']
      }
    ],
    'ip': [
      {
        title: 'Trademark Registration',
        description: 'Brand protection and IP rights.',
        features: ['Trademark Search', 'Application Filing', 'Objection Handling', 'Hearing Support', 'Registration Certificate', 'Processing Time: 5-7 business days']
      },
      {
        title: 'Copyright Registration',
        description: 'Protect your original creative work from unauthorized use.',
        features: ['Copyright Filing', 'Objection Reply', 'Registration Certificate', 'Infringement Protection', 'Global Recognition', 'Processing Time: 5-7 business days']
      },
      {
        title: 'Patent Registration',
        description: 'Exclusive rights for your inventions and intellectual property.',
        features: ['Prior Art Search', 'Patent Drafting', 'Filing Application', 'Examination Report Reply', 'Grant of Patent', 'Processing Time: 5-7 business days']
      }
    ],
    'licensing': [
      {
        title: 'FSSAI Registration',
        description: 'Registration for food business operators, manufacturers, and startups.',
        features: ['Basic/State/Central License', 'Food Safety Audit', 'Premise Inspection Support', 'Renewal Reminders', 'Product Category Mapping', 'Processing Time: 5-7 business days']
      },
      {
        title: 'ISO Certification',
        description: 'Quality management certification (ISO 9001 and others).',
        features: ['Process Audit', 'Quality Manual', 'Certification Support', 'Annual Surveillance', 'Training', 'Processing Time: 5-7 business days']
      },
      {
        title: 'DPIIT Certification',
        description: 'Startup India Certification for your startup! Please provide your details correctly.',
        features: ['Govt Subsidy Assistance', 'Tax Exemption Support', 'Priority Sector Lending Support', 'Collateral Free Loan Support', 'IPR Fast Track', 'Processing Time: 5-7 business days']
      },
      {
        title: 'IE code',
        description: 'Import Export Code registration for cross-border trade.',
        features: ['Application Filing', 'DGFT Registration', 'Modification Support', 'Customs Clearance Help', 'IEC Certificate', 'Processing Time: 5-7 business days']
      },
      {
        title: 'LEI',
        description: 'Legal Entity Identifier registration for financial transactions.',
        features: ['LEI Application', 'Global Directory Listing', 'Renewal Management', 'Data Validation', 'LEI Code Generation', 'Processing Time: 5-7 business days']
      },
      {
        title: 'BIS',
        description: 'Bureau of Indian Standards product certification.',
        features: ['Product Testing', 'Factory Inspection', 'Application Filing', 'Grant of License', 'Renewal Support', 'Processing Time: 5-7 business days']
      },
      {
        title: 'ROSH & CE',
        description: 'European standard certifications for electronics and products.',
        features: ['Documentation Preparation', 'Testing Coordination', 'Compliance Audit', 'Declaration of Conformity', 'Certification Grant', 'Processing Time: 5-7 business days']
      }
    ],
    'tax': [
      {
        title: 'GST Onboarding',
        description: 'GST Registration for your business! Thank you for choosing Wealth Empires.',
        features: ['GST Application Filing', 'Document Verification', 'ARN Generation', 'Clarification Support', 'GSTIN Certificate', 'Processing Time: 5-7 business days']
      },
      {
        title: 'GST Compliance',
        description: 'Monthly/Quarterly GST returns and reconciliations.',
        features: ['GSTR-1 & 3B Filing', 'GSTR-2A/2B Reconciliation', 'Input Tax Credit (ITC)', 'Annual Return GSTR-9', 'Audit Support', 'Processing Time: 5-7 business days']
      },
      {
        title: 'GST Cancelation',
        description: 'Surrender and cancel your GST registration.',
        features: ['Application for Cancellation', 'Final Return GSTR-10', 'Reply to Notices', 'Assessment Clearance', 'Cancellation Order', 'Processing Time: 5-7 business days']
      },
      {
        title: 'GST filing',
        description: 'Seamless filing of standard GST returns.',
        features: ['Monthly Returns', 'Data Validation', 'Challan Payment', 'Error Correction', 'Filing Acknowledgment', 'Processing Time: 5-7 business days']
      },
      {
        title: 'ITR',
        description: 'Income Tax Return filing for individuals and businesses.',
        features: ['Income Computation', 'Tax Saving Advisory', 'Return Filing (ITR 1-7)', 'Refund Tracking', 'Assessment Support', 'Processing Time: 5-7 business days']
      }
    ],
    'other': [
      {
        title: 'Individual DSC',
        description: 'Class 3 Digital Signature Certificate for Individuals.',
        features: ['Identity Verification', 'Digital Signature Creation', 'USB Token', 'Validity 2 Years', 'Technical Support', 'Processing Time: 5-7 business days']
      },
      {
        title: 'Organization DSC',
        description: 'Class 3 Digital Signature Certificate for Organizations.',
        features: ['Organization Verification', 'Digital Signature Creation', 'USB Token', 'Validity 2 Years', 'Technical Support', 'Processing Time: 5-7 business days']
      }
    ]
  };

  user = signal<any>(null);
  selectedCategory = signal<string>('incorporation');
  selectedService = signal<any>(null);
  currentServices = signal<any[]>([]);
  clientManager = signal<any>(null);
  availableEntities = signal<string[]>([]);

  // Form State
  quoteForm = {
    name: '',
    phone: '',
    email: '',
    requirements: '',
    numberOfDirectors: '',
    selectedEntity: '',
    customEntity: ''
  };
  formSubmitting = signal<boolean>(false);
  formSuccess = signal<boolean>(false);

  constructor(private api: Api, private route: ActivatedRoute) {}

  ngOnInit() {
    this.selectCategory('incorporation');
    
    this.route.queryParams.subscribe(params => {
      if (params['serviceName']) {
        const requestedService = params['serviceName'].toLowerCase();
        let foundCategory = null;
        let foundService = null;
        for (const cat of Object.keys(this.servicesDatabase)) {
          const s = this.servicesDatabase[cat].find((x: any) => x.title.toLowerCase() === requestedService);
          if (s) {
            foundCategory = cat;
            foundService = s;
            break;
          }
        }
        if (foundCategory && foundService) {
          this.selectCategory(foundCategory);
          this.selectService(foundService);
        } else if (params['category']) {
          this.selectCategory(params['category']);
        }
      } else if (params['category']) {
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
    this.fetchEntities();
  }

  fetchClientManager() {
    const userVal = this.user();
    if (!userVal) return;
    const uid = userVal._id || userVal.id;
    if (!uid) return;

    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res) => {
        if (res.user && res.user.client_manager) {
          this.clientManager.set(res.user.client_manager);
        } else if (res.user && res.user.assigned_to) {
          this.clientManager.set(res.user.assigned_to);
        }
      },
      error: (err) => console.error('Failed to fetch client manager:', err)
    });
  }

  fetchEntities() {
    this.api.get<any>('my-checklists').subscribe({
      next: (res) => {
        let entities = new Set<string>();
        if (res.checklists) {
          res.checklists.forEach((c: any) => {
            if (c.details && c.details.entityName && c.details.entityName.toLowerCase() !== 'client') {
              entities.add(c.details.entityName);
            }
          });
        }
        
        const userVal = this.user();
        if (userVal?.company_name) {
          entities.add(userVal.company_name);
        }

        const entityArray = Array.from(entities);
        entityArray.push('Add New Entity...');
        
        this.availableEntities.set(entityArray);
        if (entityArray.length > 0) {
          this.quoteForm.selectedEntity = entityArray[0];
        }
      },
      error: (err) => console.error('Failed to fetch entities:', err)
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

  showDirectorCount(): boolean {
    const title = this.selectedService()?.title;
    return title === 'Private Limited Incorporation' || title === 'LLP Incorporation';
  }

  showEntityDropdown(): boolean {
    const title = this.selectedService()?.title;
    if (!title) return false;
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('incorporation')) return false;
    if (title === 'MSME Registration' || title === 'OPC' || title === 'Proprietorship Registration' || title === 'Partnership Firm Registration') return false;
    return true;
  }

  getProcessingTime(features: string[]): string {
    if (!features) return '';
    const pt = features.find(f => f.startsWith('Processing Time:'));
    return pt ? pt.replace('Processing Time:', '').trim() : '5-7 business days';
  }

  getRegularFeatures(features: string[]): string[] {
    if (!features) return [];
    return features.filter(f => !f.startsWith('Processing Time:'));
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

    if (this.showEntityDropdown()) {
      const finalEntity = this.quoteForm.selectedEntity === 'Add New Entity...' 
        ? this.quoteForm.customEntity 
        : this.quoteForm.selectedEntity;
      if (finalEntity) {
        formData.append('entity_name', finalEntity);
      }
    }

    const details: any = {
      Status: 'Pending Client Form Submission',
      'Next Step': 'Assign expert to unlock form for client',
      Requirements: this.quoteForm.requirements
    };

    if (this.showDirectorCount()) {
      if (this.quoteForm.numberOfDirectors) {
        details['numberOfDirectors'] = this.quoteForm.numberOfDirectors;
      }
    }

    formData.append('details', JSON.stringify(details));

    this.api.post<any>(`users/profile/${uid}/subscribe-service`, formData).subscribe({
      next: (res) => {
        this.formSubmitting.set(false);
        if (res && res.success) {
          this.formSuccess.set(true);
          alert('Successfully submitted your application');
          this.quoteForm = { name: '', phone: '', email: '', requirements: '', numberOfDirectors: '', selectedEntity: this.availableEntities()[0], customEntity: '' };
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
