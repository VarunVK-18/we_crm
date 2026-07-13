import { Component, OnInit, signal, inject, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-payment-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './payment-tracker.html',
  styleUrl: './payment-tracker.css'
})
export class PaymentTrackerComponent implements OnInit {
  api = inject(Api);

  @Output() onViewChecklist = new EventEmitter<string>();
  @Output() onViewClient = new EventEmitter<string>();
  
  isLoading = signal<boolean>(true);
  expenses = signal<any[]>([]);
  userRole = signal<string>('');
  processingIds = signal<Set<string>>(new Set());
  monthFilter = signal<string>('');
  dateFilter = signal<string>('');

  // Mark Paid Modal
  showProofModal = signal<boolean>(false);
  selectedExpense = signal<any>(null);
  proofFile = signal<File | null>(null);
  proofPreviewUrl = signal<string | null>(null);
  isSubmittingProof = signal<boolean>(false);

  // View Proof Modal
  showViewProofModal = signal<boolean>(false);
  viewingProofUrl = signal<string | null>(null);

  pendingExpenses = computed(() => this.expenses().filter(e => e.reimbursementStatus !== 'paid'));
  
  historyExpenses = computed(() => {
    const paid = this.expenses().filter(e => e.reimbursementStatus === 'paid');
    const mFilter = this.monthFilter();
    const dFilter = this.dateFilter();
    
    if (!mFilter && !dFilter) return paid;
    return paid.filter(e => {
      if (!e.uploadedAt) return false;
      if (dFilter) return e.uploadedAt.startsWith(dFilter);
      if (mFilter) return e.uploadedAt.startsWith(mFilter);
      return true;
    });
  });

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        this.userRole.set(u.role || '');
      } catch (e) {}
    }
    this.fetchExpenses();
  }

  fetchExpenses() {
    this.isLoading.set(true);
    this.api.get<any>('checklists/expenses').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.expenses.set(res.expenses || []);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch expenses:', err);
        this.isLoading.set(false);
      }
    });
  }

  openMarkPaidModal(expense: any) {
    this.selectedExpense.set(expense);
    this.proofFile.set(null);
    this.proofPreviewUrl.set(null);
    this.showProofModal.set(true);
  }

  closeProofModal() {
    this.showProofModal.set(false);
    this.selectedExpense.set(null);
    this.proofFile.set(null);
    this.proofPreviewUrl.set(null);
  }

  onProofFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    this.proofFile.set(file);
    const reader = new FileReader();
    reader.onload = (e: any) => this.proofPreviewUrl.set(e.target.result);
    reader.readAsDataURL(file);
  }

  submitMarkPaid() {
    const expense = this.selectedExpense();
    if (!expense) return;
    if (!this.proofFile()) {
      alert('Please upload a payment screenshot before confirming.');
      return;
    }

    this.isSubmittingProof.set(true);
    const uniqueId = `${expense.checklistId}-${expense.itemId}`;
    const currentSet = new Set(this.processingIds());
    currentSet.add(uniqueId);
    this.processingIds.set(currentSet);

    const formData = new FormData();
    formData.append('proof', this.proofFile()!);
    if (expense.expenseId) formData.append('expenseId', expense.expenseId);

    this.api.post<any>(`checklists/${expense.checklistId}/items/${expense.itemId}/reimburse`, formData).subscribe({
      next: (res) => {
        if (res && res.success) {
          // Update local state with the proof preview
          const proofUrl = this.proofPreviewUrl();
          const updated = this.expenses().map(e => {
            if (e.checklistId === expense.checklistId && e.itemId === expense.itemId) {
              return { ...e, reimbursementStatus: 'paid', paymentProofUrl: proofUrl, paidAt: new Date().toISOString() };
            }
            return e;
          });
          this.expenses.set(updated);
          this.closeProofModal();
        }
        this.isSubmittingProof.set(false);
        this.removeProcessing(uniqueId);
      },
      error: (err) => {
        console.error('Failed to mark expense as paid:', err);
        alert(err.error?.message || 'Failed to update expense status');
        this.isSubmittingProof.set(false);
        this.removeProcessing(uniqueId);
      }
    });
  }

  openViewProof(url: string) {
    this.viewingProofUrl.set(url);
    this.showViewProofModal.set(true);
  }

  closeViewProof() {
    this.showViewProofModal.set(false);
    this.viewingProofUrl.set(null);
  }

  private removeProcessing(id: string) {
    const currentSet = new Set(this.processingIds());
    currentSet.delete(id);
    this.processingIds.set(currentSet);
  }

  isManager() {
    return ['admin', 'manager'].includes(this.userRole());
  }

  openBill(url: string) {
    if (!url) return;
    // Handle both base64 data URIs and regular URLs
    if (url.startsWith('data:')) {
      const win = window.open();
      if (win) win.document.write(`<img src="${url}" style="max-width:100%;">`);
    } else {
      const fullUrl = this.api.getFileUrl(url);
      window.open(fullUrl, '_blank');
    }
  }

  goToService(checklistId: string) {
    if (checklistId) {
      this.onViewChecklist.emit(checklistId);
    }
  }

  goToClient(clientId: string) {
    if (clientId && this.userRole() !== 'filling_staff' && this.userRole() !== 'filing_staff') {
      this.onViewClient.emit(clientId);
    }
  }
}
