import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { OcrService } from '../../services/ocr.service';

const bucketCache = {
  requests: null as any[] | null,
  jobs: null as any[] | null,
  lastFetchTime: 0
};

@Component({
  selector: 'app-bucket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bucket.html',
  styleUrl: './bucket.css'
})
export class BucketComponent implements OnInit {
  api = inject(Api);
  ocrService = inject(OcrService);

  user = signal<any>(null);
  requests = signal<any[]>([]);
  jobs = signal<any[]>([]);
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

  isAcceptFormValid = computed(() => {
    if (!this.selectedTeamId()) return false;
    if (this.requiresDirectorCount() && (!this.directorCount() || this.directorCount()! < 1)) return false;
    
    const dealAmount = Number(this.dealClosedAmount());
    if (isNaN(dealAmount) || dealAmount <= 0) return false;

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

  loadData() {
    this.isLoading.set(true);
    const page = this.currentPage();
    const limit = this.limit();

    if (this.isManager) {
      const status = this.activeTab() === 'all' ? 'all' : this.activeTab();
      this.api.get<any>(`bucket/requests?status=${status}&page=${page}&limit=${limit}`).subscribe({
        next: (res) => {
          this.requests.set(res.requests || []);
          this.totalPages.set(res.totalPages || 1);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else if (this.isFillingStaff) {
      this.api.get<any>(`bucket/available?page=${page}&limit=${limit}`).subscribe({
        next: (res) => {
          this.jobs.set(res.jobs || []);
          this.totalPages.set(res.totalPages || 1);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
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

    const payload = {
      team_id: teamId,
      dealClosedAmount: dealAmount,
      advanceAmountPaid: advanceAmount,
      directorCount: this.directorCount()
    };

    this.api.post<any>(`bucket/requests/${req._id}/claim`, payload).subscribe({
      next: (res) => {
        if (advanceAmount > 0 && res.checklist) {
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
      error: (err) => {
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

  selfAssign(id: string) {
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
