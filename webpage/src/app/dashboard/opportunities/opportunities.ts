import { Component, OnInit, signal, computed, inject, Output, EventEmitter, input, effect } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Search01Icon, PlusSignIcon, CheckmarkCircle02Icon, TrendingUpDownIcon, Mail01Icon, UserAccountIcon } from '@hugeicons/core-free-icons';


@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './opportunities.html',
  styleUrl: './opportunities.css'
})
export class Opportunities implements OnInit {
  @Output() onViewChecklist = new EventEmitter<string>();
  preselectedClientId = input<string>('');
  private api = inject(Api);
  clients = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  selectedClientIndex = signal<number>(0);
  
  // Pagination & Filter state
  currentPage = signal<number>(1);
  itemsPerPage = 10;
  totalPages = signal<number>(1);
  totalPendingOpportunities = signal<number>(0);

  searchQuery = signal<string>('');
  filterCount = signal<string>('any');
  filterCategory = signal<string>('all');
  
  paginatedClients = computed(() => this.clients()); // For backward compatibility with template loop

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
      this.fetchOpportunities();
    }
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }

  readonly Search01Icon = Search01Icon;
  readonly PlusSignIcon = PlusSignIcon;
  readonly CheckmarkCircle02Icon = CheckmarkCircle02Icon;
  readonly TrendingUpDownIcon = TrendingUpDownIcon;
  readonly Mail01Icon = Mail01Icon;
  readonly UserAccountIcon = UserAccountIcon;

  // We will combine all categories of services here
  recommendationPool = [
    // Incorporation
    { category: 'Incorporation', name: 'Private Limited Incorporation', desc: 'Complete company incorporation with name approval, DSC, DIN, and MCA filing.', avgWorkingDays: '7–10 days', documentsRequired: ['Directors Aadhar & PAN Card', 'EB Bill < 2 months'], features: ['Drafting AOA & MOA', 'Certificate of Incorporation (COI)', 'Corporate Identification Number (CIN)', 'PAN & TAN', 'Director Identification Numbers (DINs)', 'Digital Signature Certificates (DSCs)', 'Corporate Bank Setup support'] },
    { category: 'Incorporation', name: 'LLP Incorporation', desc: 'Register your LLP with name approval, incorporation, PAN, and MCA filing.', avgWorkingDays: '7–10 days', documentsRequired: ['Partners Aadhar & PAN Card', 'EB Bill < 2 months'], features: ['Drafting & Registration of LLP Agreement', 'Certificate of Incorporation (COI)', 'LLP Identification Number (LLPIN)', 'PAN & TAN', 'Designated Partner Identification Numbers (DPINs)', 'Digital Signature Certificates (DSCs)', 'Corporate Bank Setup support'] },
    { category: 'Incorporation', name: 'OPC Incorporation', desc: 'Register your One Person Company with complete MCA incorporation support.', avgWorkingDays: '7–10 days', documentsRequired: ['Director & Nominee Aadhar & PAN Card', 'EB Bill < 2 months'], features: ['Nominee Appointment Documentation', 'Certificate of Incorporation (COI)', 'Corporate Identification Number (CIN)', 'PAN & TAN', 'Director Identification Numbers (DINs)', 'Digital Signature Certificates (DSCs)', 'Drafting AOA & MOA Corporate Bank Setup support'] },
    { category: 'Incorporation', name: 'MSME Registration', desc: 'Obtain Udyam Registration to access MSME benefits and business recognition.', avgWorkingDays: '1–2 days', documentsRequired: ['Aadhar & PAN Card', 'Bank account details', 'EB Bill < 2 months'] },
    { category: 'Incorporation', name: 'Proprietorship Registration', desc: 'Start your sole proprietorship with essential business registration support.', avgWorkingDays: '5–7 days', features: ['Documentation support'] },
    
    // Compliance
    { category: 'Compliance', name: 'MCA Compliance', desc: 'Complete annual ROC filings and MCA compliance for your company.', avgWorkingDays: 'On time', documentsRequired: ['Last Year Bank Statements', 'All Company documents'] },
    { category: 'Compliance', name: 'TDS Return Filing', desc: 'Prepare and file TDS returns with corrections and certificate generation.', avgWorkingDays: '2–4 days', documentsRequired: ['TAN & PAN', 'Salary Details', 'Previous TDS Return / RPU File (if available)', 'Valid Digital Signature'] },
    { category: 'Compliance', name: 'PF Registration & Compliance', desc: 'Complete PF registration with employee enrollment and monthly compliance.', avgWorkingDays: '5–7 days', documentsRequired: ['Employee Master Details', 'PF Contribution Details', 'Employee KYC Details', 'Bank Account Details'] },

    // IP
    { category: 'IP', name: 'Trademark Registration', desc: 'Protect your business name, logo, and brand through trademark registration.', avgWorkingDays: '5–7 days', documentsRequired: ['Trademark Logo', 'MSME Certificate'] },
    { category: 'IP', name: 'Copyright Registration', desc: 'Register your original creative work with official copyright protection.', avgWorkingDays: '12–15 days', documentsRequired: ['Identity Proof of Applicant', 'Details of the Copyright Work'] },
    { category: 'IP', name: 'Patent Registration', desc: 'Secure legal protection for your invention through professional patent filing.', avgWorkingDays: '12–15 days', documentsRequired: ['Company Registration Documents', 'Details of the Invention', 'Technical Documents'] },

    // Tax
    { category: 'Tax', name: 'Income Tax Return (ITR)', desc: 'Income Tax Return filing for individuals and businesses.' },
    { category: 'Tax', name: 'GST Registration', desc: 'Register for GST and receive your GSTIN with complete filing support.', avgWorkingDays: '5–7 days', documentsRequired: ['Aadhaar & PAN Card', 'Recent Photograph of the applicant', 'Proof of Principal Place of Business', 'Cancelled Cheque or Bank Statement'] },
    { category: 'Tax', name: 'GST Returns Filing', desc: 'File monthly or quarterly GST returns with accurate reconciliation support.', avgWorkingDays: '1–3 days' },
    { category: 'Tax', name: 'GST Cancellation', desc: 'Cancel your GST registration with proper filing and legal compliance.', avgWorkingDays: '5–10 days' },

    // Licensing
    { category: 'Licensing', name: 'DPIIT Recognition', desc: 'Get Startup India recognition with complete DPIIT registration support.', avgWorkingDays: '5–7 days' },
    { category: 'Licensing', name: 'ISO Certification', desc: 'Obtain ISO certification with documentation and audit support services.', avgWorkingDays: '5–7 days', documentsRequired: ['Recent Invoice copy raised', 'Address Proof', 'Authorised Letter'], features: ['ISO Certificate via Courier'] },
    { category: 'Licensing', name: 'FSSAI Registration', desc: 'Register your food business and obtain the required FSSAI license.', avgWorkingDays: '1–3 days', documentsRequired: ['Company Incorporation documents', 'Proof of Business Address', 'NOC from Premises Owner'] },
    { category: 'Licensing', name: 'Import Export Code (IEC)', desc: 'Import Export Code registration for cross-border trade.' },
    { category: 'Licensing', name: 'Digital Signature Certificate (DSC)', desc: 'Digital Signature Certificate for individuals & organizations.' },
    { category: 'Licensing', name: 'DUNS Number', desc: 'Obtain a D-U-N-S Number for global business identification and credibility.', avgWorkingDays: '1–3 days', documentsRequired: ['Address Proof (Utility bill / Bank statement)', 'Company Incorporation & PAN'] },
    { category: 'Licensing', name: 'BIS Certification', desc: 'Obtain BIS certification for products meeting Indian quality standards.', avgWorkingDays: '30–90 days' },
    { category: 'Licensing', name: 'LEI Registration', desc: 'Obtain a Legal Entity Identifier for financial and banking transactions.', avgWorkingDays: '1–3 days' },
    { category: 'Licensing', name: 'CE Certification', desc: 'Meet regulatory certification requirements before product launch.', avgWorkingDays: '5–7 days' },
    { category: 'Licensing', name: 'RoHS Certification', desc: 'Obtain RoHS certification for products meeting hazardous substance regulations.', avgWorkingDays: '5–7 days' },
  ];

  // Modal State
  isAssignModalOpen = signal<boolean>(false);
  selectedOpportunity = signal<any>(null);
  selectedClientForAssign = signal<any>(null);
  teams = signal<any[]>([]);
  selectedTeamId = signal<string>('');
  dealClosedAmount = signal<number | null>(null);
  advanceAmountPaid = signal<number | null>(null);
  directorCount = signal<number | null>(null);
  dealAmountStr = signal<string>('');
  advanceAmountStr = signal<string>('');
  dueDate = signal<string>('');
  minDueDate = computed(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  priority = signal<string>('High');
  claimingId = signal<string | null>(null);
  systemSettings = signal<any>(null);
  
  onDealAmountChange(val: string) {
    const numeric = val.replace(/[^0-9]/g, '');
    if (numeric) {
      this.dealClosedAmount.set(parseInt(numeric, 10));
      this.dealAmountStr.set(new Intl.NumberFormat('en-IN').format(parseInt(numeric, 10)));
    } else {
      this.dealClosedAmount.set(null);
      this.dealAmountStr.set('');
    }
  }

  onAdvanceAmountChange(val: string) {
    const numeric = val.replace(/[^0-9]/g, '');
    if (numeric) {
      this.advanceAmountPaid.set(parseInt(numeric, 10));
      this.advanceAmountStr.set(new Intl.NumberFormat('en-IN').format(parseInt(numeric, 10)));
    } else {
      this.advanceAmountPaid.set(null);
      this.advanceAmountStr.set('');
    }
  }

  requiresDirectorCount = computed(() => {
    const opp = this.selectedOpportunity();
    if (!opp) return false;
    const name = opp.name?.toLowerCase() || '';
    return name.includes('private limited') || 
           name.includes('incorp') ||
           name.includes('llp') || 
           name.includes('opc') || 
           name.includes('mca') || 
           name.includes('digital signature') ||
           name.includes('dsc');
  });

  isAcceptFormValid = computed(() => {
    if (!this.selectedTeamId()) return false;
    if (!this.dueDate()) return false;
    if (this.requiresDirectorCount() && (!this.directorCount() || this.directorCount()! < 1)) return false;
    
    const dealAmount = Number(this.dealClosedAmount());
    if (isNaN(dealAmount) || dealAmount <= 0) return false;

    const advanceAmount = Number(this.advanceAmountPaid());
    if (isNaN(advanceAmount) || advanceAmount < 0) return false;

    if (advanceAmount > dealAmount) return false;

    return true;
  });

  availableCategories = computed(() => {
    const cats = new Set<string>();
    this.recommendationPool.forEach(p => cats.add(p.category));
    return Array.from(cats);
  });

  private searchTimeout: any;

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.fetchOpportunities();
    }, 400);
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.fetchOpportunities();
  }

  constructor() {
    effect(() => {
      const preId = this.preselectedClientId();
      if (preId && this.clients().length > 0) {
        const idx = this.clients().findIndex((c: any) => c._id === preId);
        if (idx !== -1) this.selectedClientIndex.set(idx);
      }
    });
  }

  ngOnInit() {
    this.fetchOpportunities();

    const saved = localStorage.getItem('user');
    const user = saved ? JSON.parse(saved) : null;

    this.api.get<any>('teams').subscribe({
      next: (res) => {
        let allTeams = res.teams || [];
        if (user && user.role === 'client_manager') {
          allTeams = allTeams.filter((t: any) => 
            t.manager_id && (t.manager_id._id === user._id || t.manager_id === user._id)
          );
        }
        this.teams.set(allTeams);
      }
    });
  }

  fetchOpportunities() {
    this.isLoading.set(true);
    const body = {
      recommendationPool: this.recommendationPool,
      page: this.currentPage(),
      limit: this.itemsPerPage,
      searchQuery: this.searchQuery(),
      filterCount: this.filterCount(),
      filterCategory: this.filterCategory()
    };

    this.api.post<any>('users/clients/opportunities/query', body).subscribe({
      next: (res) => {
        if (res.clients) {
          // Calculate alreadyDone since it's used in the template (Right sidebar)
          const enhancedClients = res.clients.map((c: any) => {
            c.alreadyDone = this.getAlreadyDoneServices(c);
            return c;
          });
          this.clients.set(enhancedClients);
          this.totalPages.set(res.totalPages || 1);
          this.totalPendingOpportunities.set(res.totalPendingOpportunities || 0);
          
          // Auto-select client if preselected
          const preId = this.preselectedClientId();
          if (preId) {
            const idx = enhancedClients.findIndex((c: any) => c._id === preId);
            if (idx !== -1) this.selectedClientIndex.set(idx);
          } else {
            this.selectedClientIndex.set(0);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching clients:', err);
        this.isLoading.set(false);
      }
    });
  }

  generateOpportunitiesForClient(client: any) {
    const weDone = (client.we_services || []).filter((s: any) => s.status === 'completed' || s.status === 'complete' || s.stage === 'completed').map((s: any) => s.serviceName);
    const outsourced = (client.outsourced_services || []).map((s: any) => s.serviceName);
    const doneSet = new Set([...weDone, ...outsourced]);
    
    const primaryIncorpServices = ['Private Limited Incorporation', 'LLP Incorporation', 'OPC Incorporation', 'Proprietorship Registration'];
    const hasPrimaryIncorp = primaryIncorpServices.some(s => doneSet.has(s));

    return this.recommendationPool.filter(s => {
      if (doneSet.has(s.name)) return false;
      
      // Do not suggest other entity incorporation types if one is already completed
      if (hasPrimaryIncorp && primaryIncorpServices.includes(s.name)) {
        return false;
      }
      
      return true;
    });
  }

  getAlreadyDoneServices(client: any) {
    const weDone = (client.we_services || []).filter((s: any) => s.status === 'completed' || s.status === 'complete' || s.stage === 'completed').map((s: any) => ({ name: s.serviceName, source: 'WE', checklistId: s.checklistId }));
    const outsourced = (client.outsourced_services || []).map((s: any) => ({ name: s.serviceName, source: 'Outsourced' }));
    return [...weDone, ...outsourced];
  }
  
  getWeDone(client: any) {
    return (client.alreadyDone || []).filter((d: any) => d.source === 'WE');
  }

  getOutsourcedDone(client: any) {
    return (client.alreadyDone || []).filter((d: any) => d.source === 'Outsourced');
  }

  goToChecklist(checklistId: string) {
    if (checklistId) {
      this.onViewChecklist.emit(checklistId);
    }
  }
  
  markAsOutsourced(client: any, opportunity: any) {
    this.api.post<any>(`users/clients/${client._id}/outsource-service`, { serviceName: opportunity.name }).subscribe({
      next: (res) => {
        if(res.success) {
          this.clients.update(clients => {
            const index = clients.findIndex(c => c._id === client._id);
            if (index !== -1) {
              const updatedClient = { ...clients[index], outsourced_services: res.outsourced_services };
              updatedClient.opportunities = this.generateOpportunitiesForClient(updatedClient);
              updatedClient.alreadyDone = this.getAlreadyDoneServices(updatedClient);
              
              const newClients = [...clients];
              newClients[index] = updatedClient;
              return newClients;
            }
            return clients;
          });
        }
      },
      error: (err) => {
        console.error('Error marking as outsourced', err);
        alert(err.error?.message || err.message || 'Error marking as outsourced');
      }
    });
  }

  applyWithWE(client: any, opportunity: any) {
    this.selectedClientForAssign.set(client);
    this.selectedOpportunity.set(opportunity);
    this.selectedTeamId.set('');
    this.dealClosedAmount.set(null);
    this.advanceAmountPaid.set(null);
    this.directorCount.set(null);
    this.dealAmountStr.set('');
    this.advanceAmountStr.set('');
    this.dueDate.set('');
    this.priority.set('High');
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal() {
    this.isAssignModalOpen.set(false);
    this.selectedClientForAssign.set(null);
    this.selectedOpportunity.set(null);
  }

  confirmAssign() {
    const client = this.selectedClientForAssign();
    const opp = this.selectedOpportunity();
    if (!client || !opp) return;

    if (!this.isAcceptFormValid()) {
      alert('Please fill out all required fields correctly.');
      return;
    }

    this.claimingId.set(opp.name);
    const payload = {
      client_id: client._id,
      service_name: opp.name,
      team_id: this.selectedTeamId(),
      dealClosedAmount: Number(this.dealClosedAmount()),
      advanceAmountPaid: Number(this.advanceAmountPaid()),
      directorCount: this.directorCount(),
      dueDate: this.dueDate(),
      priority: this.priority()
    };

    this.api.post<any>('bucket/requests/direct-assign', payload).subscribe({
      next: (res) => {
        alert('Assigned successfully!');
        this.claimingId.set(null);
        this.closeAssignModal();
        // Remove the opportunity from the UI
        this.clients.update(clients => {
          const index = clients.findIndex(c => c._id === client._id);
          if (index !== -1) {
            const updatedClient = { ...clients[index] };
            updatedClient.opportunities = updatedClient.opportunities.filter((o: any) => o.name !== opp.name);
            // Optionally add to weDone
            updatedClient.alreadyDone = [...(updatedClient.alreadyDone || []), { name: opp.name, source: 'WE', checklistId: res.checklist?._id }];
            const newClients = [...clients];
            newClients[index] = updatedClient;
            return newClients;
          }
          return clients;
        });
      },
      error: (err) => {
        this.claimingId.set(null);
        alert(err?.error?.message || 'Failed to assign service.');
      }
    });
  }
}
