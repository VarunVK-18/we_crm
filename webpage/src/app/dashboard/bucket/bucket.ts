import { ResizableColumnDirective } from '../../directives/resizable-column.directive';
import { Component, OnInit, AfterViewChecked, signal, computed, inject, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { OcrService } from '../../services/ocr.service';
import { ConfirmDialogService } from '../../confirm-dialog/confirm-dialog.service';

const bucketCache = {
  requests: null as any[] | null,
  jobs: null as any[] | null,
  lastFetchTime: 0
};

@Component({
  selector: 'app-bucket',
  standalone: true,
  imports: [CommonModule, FormsModule, ResizableColumnDirective],
  templateUrl: './bucket.html',
  styleUrl: './bucket.css'
})
export class BucketComponent implements OnInit, AfterViewChecked, OnDestroy {
  api = inject(Api);
  ocrService = inject(OcrService);
  confirmDialog = inject(ConfirmDialogService);
  el = inject(ElementRef);
  @Output() onViewClient = new EventEmitter<string>();
  @Output() onViewService = new EventEmitter<string>();

  viewClient(event: Event, clientId: string) {
    event.stopPropagation();
    if (this.role !== 'filling_staff' && clientId) {
      this.onViewClient.emit(clientId);
    }
  }

  viewService(event: Event, checklistId: string) {
    event.stopPropagation();
    if (checklistId) {
      this.onViewService.emit(checklistId);
    }
  }

  private resizeObserver: ResizeObserver | null = null;
  private observedHeaders = new Set<Element>();

  ngAfterViewChecked() {
    const headers = this.el.nativeElement.querySelectorAll('.bucket-table th');
    if (headers.length > 0 && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const key = 'bucket_col_' + target.innerText.trim();
          if (target.style.width) {
            localStorage.setItem(key, target.style.width);
          }
        }
      });
    }

    headers.forEach((th: HTMLElement) => {
      if (!this.observedHeaders.has(th)) {
        const key = 'bucket_col_' + th.innerText.trim();
        const savedWidth = localStorage.getItem(key);
        if (savedWidth) {
          th.style.width = savedWidth;
        }
        if (this.resizeObserver) {
          this.resizeObserver.observe(th);
          this.observedHeaders.add(th);
        }
      }
    });
  }

  searchSubject = new Subject<void>();
  
  ngOnDestroy() {
    this.searchSubject.complete();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  onSearchChange() {
    this.searchSubject.next();
  }

  user = signal<any>(null);
  requests = signal<any[]>([]);
  
  // Manager Column Filters
  mClientIdFilter = signal<string>('');
  mCompanyNameFilter = signal<string>('');
  mServiceFilter = signal<string>('');
  mClientNameFilter = signal<string>('');
  mEmailFilter = signal<string>('');
  mPhoneFilter = signal<string>('');
  mDateFilter = signal<string>('');
  mDueDateFilter = signal<string>('');

  filteredRequests = computed(() => {
    let list = this.requests();
    const cid = this.mClientIdFilter().toLowerCase();
    const cname = this.mCompanyNameFilter().toLowerCase();
    const svc = this.mServiceFilter().toLowerCase();
    const cclient = this.mClientNameFilter().toLowerCase();
    const email = this.mEmailFilter().toLowerCase();
    const phone = this.mPhoneFilter().toLowerCase();

    if (cid) list = list.filter(r => (r.dealvoice_client_id || r.client_id?.custom_client_id || '').toLowerCase().includes(cid));
    if (cname) list = list.filter(r => (r.client_company_name || r.client_id?.company_name || '').toLowerCase().includes(cname));
    if (svc) list = list.filter(r => (r.service_name || '').toLowerCase().includes(svc));
    if (cclient) list = list.filter(r => this.getClientName(r).toLowerCase().includes(cclient));
    if (email) list = list.filter(r => (r.client_email || r.client_id?.email || '').toLowerCase().includes(email));
    if (phone) list = list.filter(r => (r.client_phone || r.client_id?.phone || '').toLowerCase().includes(phone));
    
    return list;
  });

  jobs = signal<any[]>([]);
  
  // Staff Column Filters
  sServiceIdFilter = signal<string>('');
  sClientIdFilter = signal<string>('');
  sServiceFilter = signal<string>('');
  sCompanyFilter = signal<string>('');
  sDateFilter = signal<string>('');
  sDueDateFilter = signal<string>('');

  filteredJobs = computed(() => {
    let list = this.jobs();
    const sid = this.sServiceIdFilter().toLowerCase();
    const cid = this.sClientIdFilter().toLowerCase();
    const svc = this.sServiceFilter().toLowerCase();
    const cmp = this.sCompanyFilter().toLowerCase();

    if (sid) list = list.filter(j => (j.checklist_id?.custom_service_id || '').toLowerCase().includes(sid));
    if (cid) list = list.filter(j => (j.dealvoice_client_id || j.client_id?.custom_client_id || '').toLowerCase().includes(cid));
    if (svc) list = list.filter(j => (j.service_name || '').toLowerCase().includes(svc));
    if (cmp) list = list.filter(j => (j.client_company_name || j.client_id?.company_name || '').toLowerCase().includes(cmp));
    
    return list;
  });
  bucketTeams = signal<any[]>([]);

  isLoading = signal<boolean>(true);
  activeTab = signal<string>('open');
  claimingId = signal<string | null>(null);
  assigningId = signal<string | null>(null);

  // Pagination State
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  limit = signal<number>(15);

  // Modal State
  isAcceptModalOpen = signal<boolean>(false);
  selectedBucketReq = signal<any>(null);
  selectedTeamId = signal<string>('');
  dealClosedAmount = signal<number | null>(null);
  advanceAmountPaid = signal<number | null>(null);
  directorCount = signal<number | null>(null);

  dealAmountStr = signal<string>('');
  advanceAmountStr = signal<string>('');

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

  // OCR State
  isOcrProcessing = signal<boolean>(false);
  ocrMessage = signal<string>('');
  isOcrVerified = signal<boolean>(false);
  transactionId = signal<string>('');
  paymentTimestamp = signal<string>('');

  // COI State (for external compliance requests)
  isCoiProcessing = signal<boolean>(false);
  coiExtractedMessage = signal<string>('');
  coiFile: File | null = null;
  showCoiEditForm = signal<boolean>(false);
  coiDetails = signal<{companyName: string, entityType: string, incorporationDate: string}>({
    companyName: '',
    entityType: 'Private Limited Company',
    incorporationDate: ''
  });

  // Compliance case: case1 = first year with us, case2 = renewal, case3 = from another firm
  complianceCase = signal<string>('case1');

  dueDate = signal<string>('');
  priority = signal<string>('High');

  isAcceptFormValid = computed(() => {
    if (!this.selectedTeamId()) return false;
    if (!this.dueDate()) return false;
    if (this.requiresDirectorCount() && (!this.directorCount() || this.directorCount()! < 1)) return false;
    
    const dealAmount = Number(this.dealClosedAmount());
    if (isNaN(dealAmount) || dealAmount <= 0) return false;

    // Enforce ₹15,000 minimum and COI upload for external compliance services
    const req = this.selectedBucketReq();
    if (req?.is_external_compliance) {
      if (dealAmount < 15000) return false;
      if (!this.coiFile) return false;
      
      const details = this.coiDetails();
      if (!details.companyName?.trim()) return false;
      if (!details.entityType?.trim()) return false;
      if (!details.incorporationDate) return false;
    }

    const advanceAmount = Number(this.advanceAmountPaid());
    if (isNaN(advanceAmount) || advanceAmount <= 0) return false;

    if (advanceAmount > dealAmount) return false;

    const requireVerification = this.systemSettings()?.require_payment_verification !== false;
    if (requireVerification && !this.isOcrVerified()) return false;

    return true;
  });
  systemSettings = signal<any>(null);
  systemBankSettings = signal<any>(null);

  requiresDirectorCount = computed(() => {
    const req = this.selectedBucketReq();
    if (!req) return false;
    const name = req.service_name?.toLowerCase() || '';
    return name.includes('private limited') || 
           name.includes('incorp') ||
           name.includes('llp') || 
           name.includes('opc') || 
           name.includes('mca') || 
           name.includes('digital signature') ||
           name.includes('dsc');
  });

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.currentPage.set(1);
      this.loadData(true);
    });

    const saved = localStorage.getItem('user');
    if (saved) this.user.set(JSON.parse(saved));

    if (this.isManager) {
      this.api.get<any>('teams').subscribe({
        next: (res) => {
          let allTeams = res.teams || [];
          const currentUser = this.user();
          
          if (currentUser && currentUser.role === 'client_manager') {
            allTeams = allTeams.filter((t: any) => 
              t.manager_id && (t.manager_id._id === currentUser._id || t.manager_id === currentUser._id)
            );
          }
          this.bucketTeams.set(allTeams);
        }
      });
      this.api.get<any>('settings').subscribe(res => {
        this.systemSettings.set(res.settings || {});
        this.systemBankSettings.set(res.settings?.bank_details || {});
      });
    }

    this.loadData();
  }

  get role() { return this.user()?.role; }

  get isManager() {
    return this.role === 'admin' || this.role === 'client_manager';
  }

  get isFillingStaff() {
    return this.role === 'filling_staff' || this.role === 'account_manager';
  }

  loadData(silent = false) {
    if (!silent) {
      this.isLoading.set(true);
    }
    const page = this.currentPage();
    const limit = this.limit();

    if (this.isManager) {
      const status = this.activeTab() === 'all' ? 'all' : this.activeTab();
      let url = `bucket/requests?status=${status}&page=${page}&limit=${limit}`;
      const cid = this.mClientIdFilter().trim();
      const cname = this.mCompanyNameFilter().trim();
      const svc = this.mServiceFilter().trim();
      const cclient = this.mClientNameFilter().trim();
      const email = this.mEmailFilter().trim();
      const phone = this.mPhoneFilter().trim();
      const dateStr = this.mDateFilter().trim();
      const dueDateStr = this.mDueDateFilter().trim();

      if (cid) url += `&searchClientId=${encodeURIComponent(cid)}`;
      if (cname) url += `&searchCompany=${encodeURIComponent(cname)}`;
      if (svc) url += `&searchService=${encodeURIComponent(svc)}`;
      if (cclient) url += `&searchClientName=${encodeURIComponent(cclient)}`;
      if (email) url += `&searchEmail=${encodeURIComponent(email)}`;
      if (phone) url += `&searchPhone=${encodeURIComponent(phone)}`;
      if (dateStr) url += `&searchDate=${encodeURIComponent(dateStr)}`;
      if (dueDateStr) url += `&searchDueDate=${encodeURIComponent(dueDateStr)}`;

      this.api.get<any>(url).subscribe({
        next: (res) => {
          this.requests.set(res.requests || []);
          this.totalPages.set(res.totalPages || 1);
          if (!silent) this.isLoading.set(false);
        },
        error: () => {
          if (!silent) this.isLoading.set(false);
        }
      });
    } else if (this.isFillingStaff) {
      let url = `bucket/available?page=${page}&limit=${limit}`;
      const sid = this.sServiceIdFilter().trim();
      const cid = this.sClientIdFilter().trim();
      const svc = this.sServiceFilter().trim();
      const cmp = this.sCompanyFilter().trim();
      const dateStr = this.sDateFilter().trim();
      const dueDateStr = this.sDueDateFilter().trim();

      if (sid) url += `&searchServiceId=${encodeURIComponent(sid)}`;
      if (cid) url += `&searchClientId=${encodeURIComponent(cid)}`;
      if (svc) url += `&searchService=${encodeURIComponent(svc)}`;
      if (cmp) url += `&searchCompany=${encodeURIComponent(cmp)}`;
      if (dateStr) url += `&searchDate=${encodeURIComponent(dateStr)}`;
      if (dueDateStr) url += `&searchDueDate=${encodeURIComponent(dueDateStr)}`;

      this.api.get<any>(url).subscribe({
        next: (res) => {
          this.jobs.set(res.jobs || []);
          this.totalPages.set(res.totalPages || 1);
          if (!silent) this.isLoading.set(false);
        },
        error: () => {
          if (!silent) this.isLoading.set(false);
        }
      });
    }
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadData();
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadData();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadData();
    }
  }

  openAcceptModal(req: any) {
    this.selectedBucketReq.set(req);
    this.selectedTeamId.set('');
    this.dealClosedAmount.set(null);
    this.advanceAmountPaid.set(null);
    this.directorCount.set(null);
    this.ocrMessage.set('');
    this.dueDate.set('');
    this.priority.set('High');
    this.coiFile = null;
    this.coiExtractedMessage.set('');
    this.isCoiProcessing.set(false);
    this.showCoiEditForm.set(false);
    this.coiDetails.set({ companyName: '', entityType: 'Private Limited Company', incorporationDate: '' });
    this.complianceCase.set('case1');
    this.isAcceptModalOpen.set(true);
  }

  closeAcceptModal() {
    this.isAcceptModalOpen.set(false);
    this.selectedBucketReq.set(null);
    this.selectedTeamId.set('');
    this.dealClosedAmount.set(null);
    this.advanceAmountPaid.set(null);
    this.directorCount.set(null);
    this.dealAmountStr.set('');
    this.advanceAmountStr.set('');
    this.ocrMessage.set('');
    this.isOcrVerified.set(false);
    this.transactionId.set('');
    this.paymentTimestamp.set('');
    this.dueDate.set('');
    this.priority.set('High');
    this.coiFile = null;
    this.coiExtractedMessage.set('');
    this.isCoiProcessing.set(false);
    this.showCoiEditForm.set(false);
    this.coiDetails.set({ companyName: '', entityType: 'Private Limited Company', incorporationDate: '' });
    this.complianceCase.set('case1');
  }

  async handleCoiUpload(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.coiFile = file;
    this.isCoiProcessing.set(true);
    this.coiExtractedMessage.set('');
    try {
      const details = await this.ocrService.extractIncorporationDetails(file);
      this.coiDetails.set({
        companyName: details.companyName || this.getClientName(this.selectedBucketReq()),
        entityType: details.entityType || 'Private Limited Company',
        incorporationDate: details.incorporationDate || ''
      });
      this.coiExtractedMessage.set('Details extracted. Review mapping.');
    } catch {
      this.coiDetails.set({ companyName: this.getClientName(this.selectedBucketReq()), entityType: 'Private Limited Company', incorporationDate: '' });
      this.coiExtractedMessage.set('File uploaded. Please fill mapped attributes.');
    } finally {
      this.isCoiProcessing.set(false);
      this.showCoiEditForm.set(true); // Auto-expand so they immediately see the mapping
    }
  }

  async handleOcrUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isOcrProcessing.set(true);
    this.ocrMessage.set('Processing image...');

    try {
      const details = await this.ocrService.extractPaymentDetails(file, this.systemBankSettings());

      if (details.amount) {
        const amt = Number(details.amount);
        this.advanceAmountPaid.set(amt);
        this.advanceAmountStr.set(new Intl.NumberFormat('en-IN').format(amt));
      }
      
      if (details.transactionId) {
        this.transactionId.set(details.transactionId);
      }

      if (details.paymentTimestamp) {
        this.paymentTimestamp.set(details.paymentTimestamp);
      }

      this.isOcrVerified.set(details.isVerified || false);

      if (details.isVerified) {
        this.ocrMessage.set('Verified: Bank match found!');
      } else {
        this.ocrMessage.set('Warning: Bank match not found.');
      }
    } catch (err) {
      this.ocrMessage.set('OCR Failed. Please enter manually.');
      console.error(err);
    } finally {
      this.isOcrProcessing.set(false);
      event.target.value = '';
    }
  }

  confirmAccept() {
    const req = this.selectedBucketReq();
    if (!req) return;

    const teamId = this.selectedTeamId();
    if (!teamId) {
      alert('Please select a filling team.');
      return;
    }

    if (!this.dueDate()) {
      alert('Please select a due date.');
      return;
    }

    if (this.requiresDirectorCount()) {
      const count = this.directorCount();
      if (count === null || count === undefined || count < 1) {
        alert('Please enter a valid Director/Partner Count.');
        return;
      }
    }

    const dealAmount = Number(this.dealClosedAmount());
    if (isNaN(dealAmount) || dealAmount <= 0) {
      alert('Please enter a valid Deal Closed Amount. It must be greater than 0.');
      return;
    }

    // Compliance services require minimum ₹15,000
    if (req.is_external_compliance && dealAmount < 15000) {
      alert('Compliance services require a minimum deal amount of ₹15,000.');
      return;
    }

    const advanceAmount = Number(this.advanceAmountPaid());
    if (isNaN(advanceAmount) || advanceAmount <= 0) {
      alert('Please enter a valid Advance Amount Paid. It must be greater than 0.');
      return;
    }

    if (advanceAmount > dealAmount) {
      alert('Advance amount cannot exceed Deal Closed amount!');
      return;
    }

    this.claimingId.set(req._id);
    this.isAcceptModalOpen.set(false);

    // Build payload — use FormData if COI file is attached (compliance request)
    const isCompliance = !!req.is_external_compliance;
    let requestObservable: any;

    if (isCompliance && this.coiFile) {
      const formData = new FormData();
      formData.append('team_id', teamId);
      formData.append('dealClosedAmount', String(dealAmount));
      formData.append('advanceAmountPaid', String(advanceAmount));
      if (this.directorCount()) formData.append('directorCount', String(this.directorCount()));
      if (this.dueDate()) formData.append('dueDate', this.dueDate());
      formData.append('priority', this.priority());
      formData.append('coiFile', this.coiFile);
      
      // Pass the extracted/edited details to the backend
      const details = this.coiDetails();
      if (details.companyName) formData.append('coi_companyName', details.companyName);
      if (details.entityType) formData.append('coi_entityType', details.entityType);
      if (details.incorporationDate) formData.append('coi_incorporationDate', details.incorporationDate);
      formData.append('compliance_case', this.complianceCase());

      requestObservable = this.api.post<any>(`bucket/requests/${req._id}/claim`, formData);
    } else {
      const payload: any = {
        team_id: teamId,
        dealClosedAmount: dealAmount,
        advanceAmountPaid: advanceAmount,
        directorCount: this.directorCount(),
        dueDate: this.dueDate(),
        priority: this.priority()
      };
      // Include compliance case for external compliance requests even without COI
      if (req.is_external_compliance) {
        payload.compliance_case = this.complianceCase();
        const details = this.coiDetails();
        if (details.companyName) payload.coi_companyName = details.companyName;
        if (details.entityType) payload.coi_entityType = details.entityType;
        if (details.incorporationDate) payload.coi_incorporationDate = details.incorporationDate;
      }
      requestObservable = this.api.post<any>(`bucket/requests/${req._id}/claim`, payload);
    }

    requestObservable.subscribe({
      next: (res: any) => {
        if (!isCompliance && advanceAmount > 0 && res.checklist) {
          const logPayload = {
            client_id: req.client_id?._id || req.client_id,
            service_name: req.service_name,
            checklist_id: res.checklist._id,
            paymentType: 'advance',
            amount: advanceAmount,
            mode: 'bank_transfer',
            notes: 'Advance recorded on bucket acceptance'
          };
          this.api.post('finance/logs', logPayload).subscribe();
        }

        bucketCache.requests = null;
        bucketCache.jobs = null;
        bucketCache.lastFetchTime = 0;
        this.claimingId.set(null);
        this.selectedBucketReq.set(null);
        this.loadData();
      },
      error: (err: any) => {
        this.claimingId.set(null);
        alert(err?.error?.message || 'Failed to accept request.');
      }
    });
  }

  declineRequest(id: string) {
    if (!confirm('Decline this bucket request?')) return;
    this.api.post<any>(`bucket/requests/${id}/decline`, {}).subscribe({
      next: () => {
        bucketCache.requests = null;
        bucketCache.jobs = null;
        bucketCache.lastFetchTime = 0;
        this.loadData();
      },
      error: (err) => alert(err?.error?.message || 'Failed to decline.')
    });
  }

  async selfAssign(id: string) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Take Job',
      message: 'Are you sure you want to take this task?',
      confirmText: 'Yes, Take Task',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    this.assigningId.set(id);
    this.api.post<any>(`bucket/requests/${id}/self-assign`, {}).subscribe({
      next: () => {
        bucketCache.requests = null;
        bucketCache.jobs = null;
        bucketCache.lastFetchTime = 0;
        this.assigningId.set(null);
        this.loadData();
      },
      error: (err) => {
        this.assigningId.set(null);
        alert(err?.error?.message || 'Failed to self-assign.');
      }
    });
  }

  getClientName(req: any): string {
    if (!req) return 'Client';
    return req.client_name || req.client_id?.owner_name || req.client_id?.company_name || 'Client';
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
