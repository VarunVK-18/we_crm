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
        description: 'Full-scale incorporation service including name reservation, DSC, DIN, MOA/AOA.',
        features: ['Name Reservation (RUN)', 'Digital Signature (DSC)', 'Director Identification (DIN)', 'MOA & AOA Drafting', 'Certificate of Incorporation', 'PAN & TAN', 'Corporate Bank Account', 'Processing Time: 5-7 business days']
      },
      {
        title: 'LLP Incorporation',
        description: 'Statutory compliance for Limited Liability Partnerships.',
        features: ['Name Reservation (RUN)', 'Digital Signature Certificate (DSC)', 'PAN & TAN', 'LLP Incorporation Certificate', 'DIN Approval Letters', 'Corporate Bank Account', 'Processing Time: 5-7 business days']
      },
      {
        title: 'OPC',
        description: 'One Person Company registration for solo entrepreneurs.',
        features: ['Name Reservation', 'DSC & DIN', 'MOA & AOA Drafting', 'Certificate of Incorporation', 'Bank Setup Support', 'Processing Time: 5-7 business days']
      },
      {
        title: 'MSME',
        description: 'Official Udyam Registration for small and medium enterprises.',
        features: ['Udyam Registration Certificate', 'Priority Sector Lending Support', 'Govt Subsidy Assistance', 'Collateral Free Loan Support', 'IP Reimbursement Advisory', 'Processing Time: 5-7 business days']
      },
      {
        title: 'Proprietorship',
        description: 'Sole vendor formation with business identification.',
        features: ['Document support', 'MSME/Udyam Registration', 'GST Registration', 'Bank Account Assistance', 'Processing Time: 5-7 business days']
      }
    ],
    'compliance': [
      {
        title: 'MCA Compliance',
        description: 'Annual return filings and MCA statutory compliance.',
        features: ['Auditor appointment', '360° Accounting & Bookkeeping', 'Statutory Auditing', 'AOC 4 & MGT 7 filing', 'Director KYC', 'AGM & Notice', 'ITR filing', 'Processing Time: 5-7 business days']
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
      }
    ],
    'ip': [
      {
        title: 'Copyright',
        description: 'Protection for original creative literary or artistic works.',
        features: ['Diary Number Generation', 'Application Filing', 'Work Submission', 'Objection Reply', 'Copyright Certificate', 'Processing Time: 5-7 business days']
      },
      {
        title: 'Trade Mark',
        description: 'Brand protection and intellectual property rights.',
        features: ['Trademark Search', 'Application Filing', 'Objection Handling', 'Hearing Support', 'Registration Certificate', 'Reimbursement Advisory', 'Processing Time: 5-7 business days']
      },
      {
        title: 'Patent',
        description: 'Exclusive rights for your inventions.',
        features: ['Patent Search', 'Provisional Drafting', 'Complete Specification', 'Examination Reply', 'Patent Grant', 'Processing Time: 5-7 business days']
      }
    ],
    'tax': [
      {
        title: 'GST filing',
        description: 'Monthly/Quarterly GST returns and reconciliations.',
        features: ['GSTR-1 & 3B Filing', 'GSTR-2A/2B Reconciliation', 'Input Tax Credit (ITC)', 'Annual Return GSTR-9', 'Audit Support', 'Processing Time: 5-7 business days']
      },
      {
        title: 'GST Cancelation',
        description: 'Surrender and cancel your GST registration.',
        features: ['Application for Cancellation', 'Final Return GSTR-10', 'Reply to Notices', 'Assessment Clearance', 'Cancellation Order', 'Processing Time: 5-7 business days']
      },
      {
        title: 'ITR',
        description: 'Income Tax Return filing for individuals and businesses.',
        features: ['Income Computation', 'Tax Saving Advisory', 'Return Filing (ITR 1-7)', 'Refund Tracking', 'Assessment Support', 'Processing Time: 5-7 business days']
      },
      {
        title: 'GST Registration',
        description: 'GST Registration for your business! Thank you for choosing Wealth Empires.',
        features: ['GST Application Filing', 'Document Verification', 'ARN Generation', 'Clarification Support', 'GSTIN Certificate', 'Processing Time: 5-7 business days']
      }
    ],
    'licensing': [
      {
        title: 'DUNS',
        description: 'Data Universal Numbering System for global business identity.',
        features: ['Global Business Identity Card', 'Mandatory Access to Tech Developer Programs', 'Creation of a Business Credit File', 'Global Vendor Onboarding (B2B Perks)', 'D&B Global Directory Listing', 'Processing Time: 5-7 business days']
      },
      {
        title: 'DPIIT',
        description: 'Startup India Certification for your startup! Please provide your details correctly.',
        features: ['Pitch deck preparation', 'Tax Exemption Support', 'Priority Sector Lending Support', 'Government approval', 'IPR Fast Track', 'Processing Time: 5-7 business days']
      },
      {
        title: 'ISO',
        description: 'Quality management certification (ISO 9001 and others).',
        features: ['Process Audit', 'Quality Manual', 'Certification Support', 'Annual Surveillance', 'Training', 'Processing Time: 5-7 business days']
      },
      {
        title: 'FSSAI',
        description: 'Registration for food business operators, manufacturers, and startups.',
        features: ['Basic/State/Central License', 'Food Safety Audit', 'Premise Inspection Support', 'Renewal Reminders', 'Product Category Mapping', 'Processing Time: 5-7 business days']
      },
      {
        title: 'DSC',
        description: 'Digital Signature Certificate for individuals & organizations.',
        features: ['Application Processing', 'Video Verification', 'KYC Verification', 'Token Procurement', '2-Year Validity', 'Processing Time: 5-7 business days']
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
  myChecklists = signal<any[]>([]);

  // Form State
  quoteForm = {
    name: '',
    phone: '',
    email: '',
    requirements: '',
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
        this.quoteForm.name = parsedUser.owner_name || parsedUser.name || '';
        this.quoteForm.phone = (parsedUser.phone || '').replace(/^\+91\s*/, '');
        this.quoteForm.email = parsedUser.email || '';
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
    this.api.get<any>('my-checklists').subscribe({
      next: (res) => {
        let entities = new Set<string>();
        if (res.checklists) {
          this.myChecklists.set(res.checklists);
          res.checklists.forEach((c: any) => {
            if (c.details && c.details.entityName && c.details.entityName.toLowerCase() !== 'client') {
              const name = c.details.entityName;
              entities.add(name);

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

        const userVal = this.user();
        if (userVal?.company_name) {
          entities.add(userVal.company_name);
        }

        const entityArray = Array.from(entities);

        // Fallback inference for entities without known type
        entityArray.forEach(name => {
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
        if (entityArray.length > 0) {
          this.quoteForm.selectedEntity = entityArray[0];
        }
      },
      error: (err) => console.error('Failed to fetch entities:', err)
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
      'Applicant Name': this.quoteForm.name || this.user()?.owner_name || '',
      'Applicant Email': this.quoteForm.email || this.user()?.email || '',
      'Applicant Phone': this.quoteForm.phone || this.user()?.phone || '',
      Status: 'Pending Client Form Submission',
      'Next Step': 'Assign expert to unlock form for client',
      Requirements: this.quoteForm.requirements
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
          this.quoteForm = { name: this.user()?.owner_name || '', phone: (this.user()?.phone || '').replace(/^\+91\s*/, ''), email: this.user()?.email || '', requirements: '', numberOfDirectors: '', selectedEntity: this.availableEntities()[0], customEntity: '', annualTurnover: 'Less than ₹20 Lakhs' };
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
