import { Component, OnInit, signal, computed } from '@angular/core';
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
    { id: 'all', label: 'All', icon: GridIcon },
    { id: 'incorporation', label: 'Incorporation', icon: OfficeIcon },
    { id: 'compliance', label: 'Compliance', icon: Briefcase01Icon },
    { id: 'ip', label: 'IP', icon: CheckmarkCircle01Icon },
    { id: 'tax', label: 'Tax', icon: CalculatorIcon },
    { id: 'licensing', label: 'Licensing', icon: LicenseIcon }
  ];

  servicesDatabase: any = {
    'incorporation': [
      {
        title: 'Private Limited Incorporation',
        description: 'Complete company incorporation with name approval, DSC, DIN, and MCA filing.',
        features: ['Name Reservation (RUN)', 'Digital Signature (DSC)', 'Director Identification (DIN)', 'MOA & AOA Drafting', 'Certificate of Incorporation', 'PAN & TAN', 'Corporate Bank Account', 'Processing Time: 7-10 days']
      },
      {
        title: 'LLP Incorporation',
        description: 'Register your LLP with name approval, incorporation, PAN, and MCA filing.',
        features: ['Name Reservation (RUN)', 'Digital Signature Certificate (DSC)', 'PAN & TAN', 'LLP Incorporation Certificate', 'DIN Approval Letters', 'Corporate Bank Account', 'Processing Time: 7-10 days']
      },
      {
        title: 'OPC Incorporation',
        description: 'Register your One Person Company with complete MCA incorporation support.',
        features: ['Name Reservation', 'DSC & DIN', 'MOA & AOA Drafting', 'Certificate of Incorporation', 'Bank Setup Support', 'Processing Time: 7-10 days']
      },
      {
        title: 'MSME Registration',
        description: 'Obtain Udyam Registration to access MSME benefits and business recognition.',
        features: ['Udyam Registration Certificate', 'Priority Sector Lending Support', 'Govt Subsidy Assistance', 'Collateral Free Loan Support', 'IP Reimbursement Advisory', 'Processing Time: 1-2 days']
      },
      {
        title: 'Proprietorship Registration',
        description: 'Start your sole proprietorship with essential business registration support.',
        features: ['Document support', 'MSME/Udyam Registration', 'GST Registration', 'Bank Account Assistance', 'Processing Time: 5-7 days']
      }
    ],
    'compliance': [
      {
        title: 'MCA Compliance',
        description: 'Complete annual ROC filings and MCA compliance for your company.',
        features: ['Auditor appointment', '360° Accounting & Bookkeeping', 'Statutory Auditing', 'AOC 4 & MGT 7 filing', 'Director KYC', 'AGM & Notice', 'ITR filing', 'Processing Time: On time']
      },
      {
        title: 'TDS Return Filing',
        description: 'Prepare and file TDS returns with corrections and certificate generation.',
        features: ['TDS Computation', 'Quarterly Return Filing', 'Form 16/16A Generation', 'Challan Payment', 'Notice Reply', 'Processing Time: 2-4 days']
      },
      {
        title: 'PF Registration & Compliance',
        description: 'Complete PF registration with employee enrollment and monthly compliance.',
        features: ['PF Registration', 'Monthly ECR Filing', 'Challan Generation', 'Employee Addition/Deletion', 'KYC Updates', 'Processing Time: 5-7 days']
      }
    ],
    'ip': [
      {
        title: 'Trademark Registration',
        description: 'Protect your business name, logo, and brand through trademark registration.',
        features: ['Trademark Search', 'Application Filing', 'Objection Handling', 'Hearing Support', 'Registration Certificate', 'Reimbursement Advisory', 'Processing Time: 5-7 days']
      },
      {
        title: 'Copyright Registration',
        description: 'Register your original creative work with official copyright protection.',
        features: ['Diary Number Generation', 'Application Filing', 'Work Submission', 'Objection Reply', 'Copyright Certificate', 'Processing Time: 12-15 days']
      },
      {
        title: 'Patent Registration',
        description: 'Secure legal protection for your invention through professional patent filing.',
        features: ['Patent Search', 'Provisional Drafting', 'Complete Specification', 'Examination Reply', 'Patent Grant', 'Processing Time: 12-15 days']
      }
    ],
    'tax': [
      {
        title: 'Income Tax Return (ITR)',
        description: 'Income Tax Return filing for individuals and businesses.',
        features: ['Income Computation', 'Tax Saving Advisory', 'Return Filing (ITR 1-7)', 'Refund Tracking', 'Assessment Support', 'Processing Time: 1-3 days']
      },
      {
        title: 'GST Registration',
        description: 'Register for GST and receive your GSTIN with complete filing support.',
        features: ['GST Application Filing', 'Document Verification', 'ARN Generation', 'Clarification Support', 'GSTIN Certificate', 'Processing Time: 5-7 days']
      },
      {
        title: 'GST Returns Filing',
        description: 'File monthly or quarterly GST returns with accurate reconciliation support.',
        features: ['GSTR-1 & 3B Filing', 'GSTR-2A/2B Reconciliation', 'Input Tax Credit (ITC)', 'Annual Return GSTR-9', 'Audit Support', 'Processing Time: 1-3 days']
      },
      {
        title: 'GST Cancellation',
        description: 'Cancel your GST registration with proper filing and legal compliance.',
        features: ['Application for Cancellation', 'Final Return GSTR-10', 'Reply to Notices', 'Assessment Clearance', 'Cancellation Order', 'Processing Time: 5-10 days']
      }
    ],
    'licensing': [
      {
        title: 'DPIIT Recognition',
        description: 'Get Startup India recognition with complete DPIIT registration support.',
        features: ['Pitch deck preparation', 'Tax Exemption Support', 'Priority Sector Lending Support', 'Government approval', 'IPR Fast Track', 'Processing Time: 5-7 days']
      },
      {
        title: 'ISO Certification',
        description: 'Obtain ISO certification with documentation and audit support services.',
        features: ['Process Audit', 'Quality Manual', 'Certification Support', 'Annual Surveillance', 'Training', 'Processing Time: 5-7 days']
      },
      {
        title: 'FSSAI Registration',
        description: 'Register your food business and obtain the required FSSAI license.',
        features: ['Basic/State/Central License', 'Food Safety Audit', 'Premise Inspection Support', 'Renewal Reminders', 'Product Category Mapping', 'Processing Time: 1-3 days']
      },
      {
        title: 'DUNS Number',
        description: 'Obtain a D-U-N-S Number for global business identification and credibility.',
        features: ['Global Business Identity Card', 'Mandatory Access to Tech Developer Programs', 'Creation of a Business Credit File', 'Global Vendor Onboarding (B2B Perks)', 'D&B Global Directory Listing', 'Processing Time: 1-3 days']
      },
      {
        title: 'Import Export Code (IEC)',
        description: 'Import Export Code registration for cross-border trade.',
        features: ['Application Filing', 'DGFT Registration', 'Modification Support', 'Customs Clearance Help', 'IEC Certificate', 'Processing Time: 1-3 days']
      },
      {
        title: 'BIS Certification',
        description: 'Obtain BIS certification for products meeting Indian quality standards.',
        features: ['Product Testing', 'Factory Inspection', 'Application Filing', 'Grant of License', 'Renewal Support', 'Processing Time: 30-90 days']
      },
      {
        title: 'CE Certification',
        description: 'Meet regulatory certification requirements before product launch.',
        features: ['Documentation Preparation', 'Testing Coordination', 'Compliance Audit', 'Declaration of Conformity', 'Certification Grant', 'Processing Time: 5-7 days']
      },
      {
        title: 'RoHS Certification',
        description: 'Obtain RoHS certification for products meeting hazardous substance regulations.',
        features: ['Documentation Preparation', 'Testing Coordination', 'Compliance Audit', 'Declaration of Conformity', 'Certification Grant', 'Processing Time: 5-7 days']
      },
      {
        title: 'LEI Registration',
        description: 'Obtain a Legal Entity Identifier for financial and banking transactions.',
        features: ['LEI Application', 'Global Directory Listing', 'Renewal Management', 'Data Validation', 'LEI Code Generation', 'Processing Time: 1-3 days']
      },
      {
        title: 'Digital Signature Certificate (DSC)',
        description: 'Digital Signature Certificate for individuals & organizations.',
        features: ['Application Processing', 'Video Verification', 'KYC Verification', 'Token Procurement', '2-Year Validity', 'Processing Time: 1-2 days']
      }
    ]
  };

  user = signal<any>(null);
  selectedCategory = signal<string>('incorporation');
  selectedService = signal<any>(null);
  currentServices = signal<any[]>([]);
  searchQuery = signal<string>('');

  filteredServices = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.currentServices();
    return this.currentServices().filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  // Pagination state
  currentPage = signal<number>(1);
  itemsPerPage = 4;

  paginatedServices = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredServices().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredServices().length / this.itemsPerPage) || 1;
  });

  pageNumbers = computed(() => {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }
  isLoadingManager = signal(true);
  clientManager = signal<any>(null);
  availableEntities = signal<string[]>([]);
  isLoadingEntities = signal<boolean>(true);
  myChecklists = signal<any[]>([]);

  // Form State
  quoteForm = {
    numberOfDirectors: '',
    selectedEntity: '',
    customEntity: '',
    annualTurnover: 'Less than ₹20 Lakhs'
  };
  formSubmitting = signal<boolean>(false);
  formSuccess = signal<boolean>(false);

  constructor(public api: Api, private route: ActivatedRoute) { }

  ngOnInit() {
    this.selectCategory('all');

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
        const parsedUser = JSON.parse(savedUser);
        this.user.set(parsedUser);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }

    this.fetchClientManager();
    this.fetchEntities();
  }

  fetchClientManager() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) {
      this.isLoadingManager.set(false);
      return;
    }

    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res) => {
        if (res.user && res.user.client_manager) {
          this.clientManager.set(res.user.client_manager);
        } else if (res.user && res.user.assigned_to) {
          this.clientManager.set(res.user.assigned_to);
        }
        this.isLoadingManager.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch client manager:', err);
        this.isLoadingManager.set(false);
      }
    });
  }

  entityTypesMap = new Map<string, string>();

  fetchEntities() {
    this.isLoadingEntities.set(true);

    // 1. Fetch checklists to populate this.myChecklists for duplicate checking
    this.api.get<any>('my-checklists').subscribe({
      next: (res) => {
        if (res.checklists) {
          this.myChecklists.set(res.checklists);
          // Still build entityTypesMap from checklists just in case
          res.checklists.forEach((c: any) => {
            if (c.details && c.details.entityName && c.details.entityName.toLowerCase() !== 'client') {
              const name = c.details.entityName;
              if (c.service_name) {
                const sName = c.service_name.toLowerCase();
                if (sName.includes('private limited incorporation')) {
                  this.entityTypesMap.set(name, 'Private Limited Company');
                } else if (sName.includes('llp incorporation')) {
                  this.entityTypesMap.set(name, 'LLP');
                } else if (sName.includes('proprietorship')) {
                  this.entityTypesMap.set(name, 'Proprietorship');
                } else if (sName.includes('opc')) {
                  this.entityTypesMap.set(name, 'OPC');
                }
              }
            }
          });
        }
      },
      error: (err) => console.error('Failed to fetch checklists', err)
    });

    // 2. Fetch proper entities from backend API
    this.api.get<any>('auth/my-entities').subscribe({
      next: (res) => {
        if (res.success && res.entities) {
          const entityArray = res.entities;

          // Fallback inference for entities without known type
          entityArray.forEach((name: string) => {
            if (!this.entityTypesMap.has(name)) {
              const lower = name.toLowerCase();
              if (lower.endsWith('pvt ltd') || lower.endsWith('private limited')) {
                this.entityTypesMap.set(name, 'Private Limited Company');
              } else if (lower.endsWith('llp')) {
                this.entityTypesMap.set(name, 'LLP');
              } else {
                this.entityTypesMap.set(name, 'Unknown');
              }
            }
          });

          entityArray.push('Add New Entity...');
          this.availableEntities.set(entityArray);

          const currentSelection = this.quoteForm.selectedEntity;
          if (!currentSelection || !entityArray.includes(currentSelection)) {
            if (entityArray.length > 0) {
              this.quoteForm.selectedEntity = entityArray[0];
            }
          }
        }
        this.isLoadingEntities.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch user entities:', err);
        this.isLoadingEntities.set(false);
      }
    });
  }

  getCompatibilityWarning(): { message: string, type: string, header: string } | null {
    const finalEntity = this.quoteForm.selectedEntity === 'Add New Entity...'
      ? this.quoteForm.customEntity
      : this.quoteForm.selectedEntity;

    if (!finalEntity) return null;

    const reqService = this.selectedService()?.title;
    if (!reqService) return null;

    const isDuplicate = this.myChecklists().some(c =>
      c.service_name === reqService &&
      (c.details?.entityName === finalEntity || (!c.details?.entityName && finalEntity === 'Client')) &&
      c.status !== 'completed' && c.status !== 'complete'
    );

    if (isDuplicate) {
      return {
        type: 'error',
        header: 'Service Already Requested',
        message: 'Service request already done wait for manager approval'
      };
    }

    const isCompleted = this.myChecklists().some(c =>
      c.service_name === reqService &&
      (c.details?.entityName === finalEntity || (!c.details?.entityName && finalEntity === 'Client')) &&
      (c.status === 'completed' || c.status === 'complete')
    );

    if (isCompleted) {
      return {
        type: 'warning',
        header: 'Service Previously Completed',
        message: 'This service was already completed for this entity. You can still submit a renewal/re-application request.'
      };
    }

    if (this.quoteForm.selectedEntity === 'Add New Entity...') return null;

    const entityType = this.entityTypesMap.get(this.quoteForm.selectedEntity) || 'Unknown';

    const isIncorporationService = reqService.includes('Incorporation') || reqService.includes('Proprietorship') || reqService === 'OPC';

    if (isIncorporationService && this.quoteForm.selectedEntity !== 'Add New Entity...') {
      let isTrulyIncorporated = false;
      const userVal = this.user();

      if (userVal && userVal.client_entities) {
        const entity = userVal.client_entities.find((e: any) => e.entityName === this.quoteForm.selectedEntity);
        if (entity && ((entity.cin && entity.cin.trim() !== '') || (entity.coi && entity.coi.trim() !== ''))) {
          isTrulyIncorporated = true;
        }
      }

      if (isTrulyIncorporated) {
        return {
          type: 'error',
          header: 'Already Incorporated',
          message: 'This service is for registering a new entity. You have selected an entity that is already fully incorporated.\n\nPlease select "Add New Entity..." to provide the proposed company details.'
        };
      }
    }

    if (entityType === 'Private Limited Company') {
      if (reqService === 'OPC' || reqService === 'Proprietorship Registration') {
        return {
          type: 'error',
          header: 'Service Not Applicable',
          message: 'This entity is already registered as a Private Limited Company. OPC Registration and Proprietorship Registration are alternative business structures and cannot be applied to this entity.'
        };
      }
      if (reqService === 'LLP Incorporation' || reqService === 'LLP Registration') {
        return {
          type: 'warning',
          header: 'Entity Conversion Required',
          message: 'This entity is already registered as a Private Limited Company. To proceed with LLP, you must either:\n• Convert the company into an LLP\nOR\n• Register a separate LLP entity'
        };
      }
    } else if (entityType === 'LLP') {
      if (reqService === 'Private Limited Incorporation') {
        return {
          type: 'warning',
          header: 'Entity Conversion Required',
          message: 'This entity is already registered as an LLP. To proceed with Private Limited Incorporation, you must either:\n• Convert the LLP into a Private Limited Company\nOR\n• Register a separate Private Limited entity'
        };
      }
    }

    return null;
  }

  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
    this.currentPage.set(1);

    let services: any[] = [];
    if (categoryId === 'all') {
      Object.keys(this.servicesDatabase).forEach(cat => {
        services = services.concat(this.servicesDatabase[cat] || []);
      });
    } else {
      services = [...(this.servicesDatabase[categoryId] || [])];
    }

    this.currentServices.set(services);

    // Auto-select first service if available
    if (this.currentServices().length > 0) {
      this.selectService(this.currentServices()[0]);
    } else {
      this.selectedService.set(null);
    }
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
    if (val.trim() && this.selectedCategory() !== 'all') {
      this.selectCategory('all');
    }
  }

  selectService(service: any) {
    this.selectedService.set(service);
    this.formSuccess.set(false);
  }

  showDirectorCount = computed(() => {
    const s = this.selectedService()?.title || '';
    return ['Private Limited Incorporation', 'LLP Incorporation', 'One Person Company'].includes(s);
  });

  showAnnualTurnover = computed(() => {
    const s = this.selectedService()?.title || '';
    return s === 'GST Compliance' || s === 'MCA Compliance';
  });

  showEntityDropdown(): boolean {
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

    if (this.showDirectorCount() && serviceName !== 'One Person Company') {
      const numDirs = Number(this.quoteForm.numberOfDirectors);
      if (!numDirs || isNaN(numDirs) || numDirs < 2) {
        alert(`Minimum 2 directors are required for ${serviceName}.`);
        this.formSubmitting.set(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('serviceName', serviceName);
    formData.append('owner_name', this.user()?.owner_name || '');
    formData.append('phone', this.user()?.phone || '');
    formData.append('email', this.user()?.email || '');

    if (this.showEntityDropdown()) {
      const finalEntity = this.quoteForm.selectedEntity === 'Add New Entity...'
        ? this.quoteForm.customEntity
        : this.quoteForm.selectedEntity;
      if (finalEntity) {
        formData.append('entity_name', finalEntity);
      }
    }

    const details: any = {
      'Applicant Name': this.user()?.owner_name || '',
      'Applicant Email': this.user()?.email || '',
      'Applicant Phone': this.user()?.phone || '',
      Status: 'Pending Client Form Submission',
      'Next Step': 'Assign expert to unlock form for client'
    };

    if (this.showDirectorCount()) {
      if (this.quoteForm.numberOfDirectors) {
        details['numberOfDirectors'] = this.quoteForm.numberOfDirectors;
      }
    }

    if (this.showAnnualTurnover()) {
      details['turnoverCategory'] = this.quoteForm.annualTurnover;
    }

    formData.append('details', JSON.stringify(details));

    this.api.post<any>(`users/profile/${uid}/subscribe-service`, formData).subscribe({
      next: (res) => {
        this.formSubmitting.set(false);
        if (res && res.success) {
          this.formSuccess.set(true);
          this.quoteForm = { numberOfDirectors: '', selectedEntity: this.availableEntities()[0], customEntity: '', annualTurnover: 'Less than ₹20 Lakhs' };
          this.fetchEntities(); // Refetch checklists to update duplicate validation
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
