import { Component, OnInit, signal, inject, computed } from '@angular/core';
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
  
  isLoading = signal<boolean>(true);
  expenses = signal<any[]>([]);
  userRole = signal<string>('');
  processingIds = signal<Set<string>>(new Set());
  monthFilter = signal<string>('');
  dateFilter = signal<string>('');

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

  markAsPaid(expense: any) {
    if (!confirm(`Are you sure you want to mark this expense as Paid?`)) return;

    const uniqueId = `${expense.checklistId}-${expense.itemId}`;
    
    // Add to processing set
    const currentSet = new Set(this.processingIds());
    currentSet.add(uniqueId);
    this.processingIds.set(currentSet);

    this.api.post<any>(`checklists/${expense.checklistId}/items/${expense.itemId}/reimburse`, {}).subscribe({
      next: (res) => {
        if (res && res.success) {
          // Update local state
          const updated = this.expenses().map(e => {
            if (e.checklistId === expense.checklistId && e.itemId === expense.itemId) {
              return { ...e, reimbursementStatus: 'paid' };
            }
            return e;
          });
          this.expenses.set(updated);
        }
        this.removeProcessing(uniqueId);
      },
      error: (err) => {
        console.error('Failed to mark expense as paid:', err);
        alert(err.error?.message || 'Failed to update expense status');
        this.removeProcessing(uniqueId);
      }
    });
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
    const fullUrl = this.api.getFileUrl(url);
    window.open(fullUrl, '_blank');
  }
}
