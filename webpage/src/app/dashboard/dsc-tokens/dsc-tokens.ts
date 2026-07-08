import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { Api } from '../../api';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Briefcase02Icon, CreditCardIcon, Alert01Icon, UserIcon, Building04Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-dsc-tokens',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, HugeiconsIconComponent],
  templateUrl: './dsc-tokens.html',
  styleUrls: ['./dsc-tokens.css']
})
export class DscTokens implements OnInit {
  readonly Briefcase02Icon = Briefcase02Icon;
  readonly CreditCardIcon = CreditCardIcon;
  readonly Alert01Icon = Alert01Icon;
  readonly UserIcon = UserIcon;
  readonly Building04Icon = Building04Icon;

  @Output() limitUpdated = new EventEmitter<void>();

  api = inject(Api);
  
  status: any = null;
  logs: any[] = [];
  currentFilter: string = 'All';

  get filteredLogs() {
    if (this.currentFilter === 'All') return this.logs;
    return this.logs.filter(log => log.serviceType === this.currentFilter);
  }
  
  purchaseAmount: number = 0;
  isPurchasing: boolean = false;
  
  warningLimit: number = 10;
  originalWarningLimit: number = 10;
  isUpdatingLimit: boolean = false;
  showLimitSuccess: boolean = false;
  
  currentPage: number = 1;
  totalPages: number = 1;

  isLoadingStatus: boolean = true;
  isLoadingLogs: boolean = true;

  ngOnInit() {
    this.fetchStatus();
    this.fetchLogs();
  }

  fetchStatus() {
    this.isLoadingStatus = true;
    this.api.get<any>('dsc-tokens/status').subscribe({
      next: (res) => {
        this.status = res;
        this.warningLimit = res.warningLimit !== undefined ? res.warningLimit : 10;
        this.originalWarningLimit = this.warningLimit;
        this.isLoadingStatus = false;
      },
      error: (err) => {
        console.error('Failed to fetch status', err);
        this.isLoadingStatus = false;
      }
    });
  }

  fetchLogs(page: number = 1) {
    this.isLoadingLogs = true;
    this.api.get<any>(`dsc-tokens/logs?page=${page}&limit=20`).subscribe({
      next: (res) => {
        this.logs = res.logs;
        this.currentPage = res.currentPage;
        this.totalPages = res.totalPages;
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Failed to fetch logs', err);
        this.isLoadingLogs = false;
      }
    });
  }

  purchaseTokens() {
    if (this.purchaseAmount <= 0) return;
    this.isPurchasing = true;
    this.api.post<any>('dsc-tokens/purchase', { amount: this.purchaseAmount }).subscribe({
      next: (res) => {
        this.purchaseAmount = 0;
        this.isPurchasing = false;
        this.fetchStatus();
        this.fetchLogs();
        alert('Tokens purchased successfully!');
      },
      error: (err) => {
        console.error('Failed to purchase tokens', err);
        this.isPurchasing = false;
        alert('Error purchasing tokens.');
      }
    });
  }

  updateWarningLimit() {
    if (this.warningLimit == null || this.warningLimit < 0) return;
    this.isUpdatingLimit = true;
    this.api.put<any>('dsc-tokens/warning-limit', { warningLimit: this.warningLimit }).subscribe({
      next: (res) => {
        this.isUpdatingLimit = false;
        this.originalWarningLimit = this.warningLimit;
        this.showLimitSuccess = true;
        setTimeout(() => this.showLimitSuccess = false, 3000);
        this.fetchStatus();
        this.limitUpdated.emit();
      },
      error: (err) => {
        console.error('Failed to update warning limit', err);
        this.isUpdatingLimit = false;
        alert('Error updating warning limit.');
      }
    });
  }
}
