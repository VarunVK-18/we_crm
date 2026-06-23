import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  CrownIcon,
  Download01Icon,
  FileAttachmentIcon,
  CheckmarkBadge01Icon,
  Building01Icon,
  Certificate01Icon,
  Key01Icon,
  Shield01Icon,
  Store01Icon,
  Briefcase01Icon,
  LegalDocument01Icon,
  Stamp01Icon
} from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';
import { ConfirmDialogService } from '../../confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-client-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule, HugeiconsIconComponent, DatePipe, WeLoaderComponent],
  templateUrl: './client-subscriptions.html',
  styleUrl: './client-subscriptions.css'
})
export class ClientSubscriptions implements OnInit {
  user = signal<any>(null);
  completedServices = signal<any[]>([]);
  isLoading = signal(true);

  // Icons
  CrownIcon = CrownIcon;
  Download01Icon = Download01Icon;
  FileAttachmentIcon = FileAttachmentIcon;
  CheckmarkBadge01Icon = CheckmarkBadge01Icon;

  constructor(
    private api: Api, 
    private router: Router,
    private confirmDialog: ConfirmDialogService
  ) {}

  getServiceIcon(service: any) {
    const name = (service.service_name || service.checklist_name || '').toLowerCase();
    
    if (name.includes('gst') || name.includes('tax')) return LegalDocument01Icon;
    if (name.includes('dsc') || name.includes('digital signature')) return Key01Icon;
    if (name.includes('msme') || name.includes('shop')) return Store01Icon;
    if (name.includes('patent') || name.includes('copyright')) return Certificate01Icon;
    if (name.includes('trademark')) return Stamp01Icon;
    if (name.includes('company') || name.includes('incorporation') || name.includes('llp') || name.includes('opc')) return Building01Icon;
    if (name.includes('fssai') || name.includes('iso') || name.includes('compliance')) return Shield01Icon;
    if (name.includes('pf') || name.includes('esi') || name.includes('labor')) return Briefcase01Icon;

    return FileAttachmentIcon; // Default
  }

  async handleServiceClick(event: Event, service: any) {
    if (this.isPaymentPending(service)) {
      event.preventDefault();
      await this.confirmDialog.confirm({
        title: 'Payment Pending',
        message: 'This service has a pending payment. Please contact your manager or complete the payment to access your invoice.',
        confirmText: 'OK',
        hideCancel: true
      });
      return;
    }
    this.router.navigate(['/client/invoice', service._id || service.id]);
  }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
      this.fetchCompletedServices();
    } else {
      this.isLoading.set(false);
    }
  }

  fetchCompletedServices() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;

    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        const completed: any[] = [];
        
        for (const c of checklists) {
          if (c.status === 'completed') {
            completed.push(c);
          }
        }
        
        this.completedServices.set(completed);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching completed services', err);
        this.isLoading.set(false);
      }
    });
  }

  getExpiryDate(): string {
    const now = new Date();
    // In India, Financial Year ends on March 31st.
    // If current month is Jan-Mar (0-2), expiry is this year. If Apr-Dec (3-11), expiry is next year.
    const targetYear = now.getMonth() > 2 ? now.getFullYear() + 1 : now.getFullYear();
    return `31 Mar ${targetYear}`;
  }

  isPaymentPending(service: any): boolean {
    const closed = service.dealClosedAmount || 0;
    const paid = service.advanceAmountPaid || 0;
    return closed > paid;
  }
}
