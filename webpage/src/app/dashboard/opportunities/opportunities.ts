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
    { category: 'Incorporation', name: 'Private Limited Incorporation', desc: 'Full-scale incorporation service including name reservation, DSC, DIN, MOA/AOA.' },
    { category: 'Incorporation', name: 'LLP Incorporation', desc: 'Statutory compliance for Limited Liability Partnerships.' },
    { category: 'Incorporation', name: 'OPC', desc: 'One Person Company registration for solo entrepreneurs.' },
    { category: 'Incorporation', name: 'MSME', desc: 'Official Udyam Registration for small and medium enterprises.' },
    { category: 'Incorporation', name: 'Proprietorship', desc: 'Sole vendor formation with business identification.' },
    
    // Compliance
    { category: 'Compliance', name: 'MCA Compliance', desc: 'Annual return filings and MCA statutory compliance.' },
    { category: 'Compliance', name: 'TDS', desc: 'TDS return filing and certificate issuance.' },
    { category: 'Compliance', name: 'PF', desc: 'Provident Fund registration and monthly compliance.' },

    // IP
    { category: 'IP', name: 'Copyright', desc: 'Protection for original creative literary or artistic works.' },
    { category: 'IP', name: 'Trade Mark', desc: 'Brand protection and intellectual property rights.' },
    { category: 'IP', name: 'Patent', desc: 'Exclusive rights for your inventions.' },

    // Tax
    { category: 'Tax', name: 'GST filing', desc: 'Monthly/Quarterly GST returns and reconciliations.' },
    { category: 'Tax', name: 'GST Cancelation', desc: 'Surrender and cancel your GST registration.' },
    { category: 'Tax', name: 'ITR', desc: 'Income Tax Return filing for individuals and businesses.' },
    { category: 'Tax', name: 'GST Registration', desc: 'GST Registration for your business! Thank you for choosing Wealth Empires.' },

    // Licensing
    { category: 'Licensing', name: 'DUNS', desc: 'Data Universal Numbering System for global business identity.' },
    { category: 'Licensing', name: 'DPIIT', desc: 'Startup India Certification for your startup! Please provide your details correctly.' },
    { category: 'Licensing', name: 'ISO', desc: 'Quality management certification (ISO 9001 and others).' },
    { category: 'Licensing', name: 'FSSAI', desc: 'Registration for food business operators, manufacturers, and startups.' },
    { category: 'Licensing', name: 'DSC', desc: 'Digital Signature Certificate for individuals & organizations.' },
    { category: 'Licensing', name: 'IE code', desc: 'Import Export Code registration for cross-border trade.' },
    { category: 'Licensing', name: 'LEI', desc: 'Legal Entity Identifier registration for financial transactions.' },
    { category: 'Licensing', name: 'BIS', desc: 'Bureau of Indian Standards product certification.' },
    { category: 'Licensing', name: 'RoHS', desc: 'Restriction of Hazardous Substances directive certification.' },
    { category: 'Licensing', name: 'CE', desc: 'European standard certifications for electronics and products.' }
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
    if (isNaN(advanceAmount) || advanceAmount <= 0) return false;

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
    
    const primaryIncorpServices = ['Private Limited Incorporation', 'LLP Incorporation', 'OPC', 'Proprietorship'];
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
