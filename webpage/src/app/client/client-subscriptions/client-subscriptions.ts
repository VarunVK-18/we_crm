import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
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
export class ClientSubscriptions implements OnInit, OnDestroy {
  user = signal<any>(null);
  completedServices = signal<any[]>([]);
  activeSubscriptions = signal<any[]>([]);
  isLoading = signal(true);

  // Entity filter synced with topbar switcher
  selectedEntity = signal<string>(localStorage.getItem('client_selected_entity') || 'All');
  private entityChangeHandler = (e: Event) => {
    this.selectedEntity.set((e as CustomEvent).detail as string);
  };

  /** Services filtered by the selected entity */
  filteredServices = computed(() => {
    const sel = this.selectedEntity();
    if (sel === 'All') return this.completedServices();
    
    return this.completedServices().filter(service => {
      const entityName = (
        service.details?.entityName ||
        service.details?.companyName ||
        service.details?.proposed_company_name ||
        service.details?.businessName ||
        service.details?.entity_name ||
        service.entityName || service.companyName || ''
      ).trim();
      return entityName.toLowerCase() === sel.toLowerCase();
    });
  });

  /** Subscriptions filtered by the selected entity */
  filteredActiveSubscriptions = computed(() => {
    const sel = this.selectedEntity();
    if (sel === 'All') return this.activeSubscriptions();
    
    return this.activeSubscriptions().filter(sub => {
      const checklist = sub.checklist_id || {};
      const entityName = (
        checklist.details?.entityName ||
        checklist.details?.companyName ||
        checklist.details?.proposed_company_name ||
        checklist.details?.businessName ||
        checklist.details?.entity_name ||
        checklist.entityName || checklist.companyName || ''
      ).trim();
      
      // If no entity name is attached, we can fallback to true to show it everywhere, 
      // or false to hide it. Better to show if we can't figure it out.
      if (!entityName) return true;
      
      return entityName.toLowerCase() === sel.toLowerCase();
    });
  });

  activeSubscriptionsList = computed(() => this.filteredActiveSubscriptions().filter(s => s.status === 'Active' || s.status === 'Pending'));
  expiringSubscriptionsList = computed(() => this.filteredActiveSubscriptions().filter(s => s.status === 'Expiring Soon'));
  expiredSubscriptionsList = computed(() => this.filteredActiveSubscriptions().filter(s => s.status === 'Expired'));
  renewedSubscriptionsList = computed(() => this.filteredActiveSubscriptions().filter(s => s.status === 'Renewed'));

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
      this.fetchActiveSubscriptions();
    } else {
      this.isLoading.set(false);
    }
    window.addEventListener('entityChanged', this.entityChangeHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('entityChanged', this.entityChangeHandler);
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

  fetchActiveSubscriptions() {
    this.api.get<any>('subscriptions/my-subscriptions').subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.activeSubscriptions.set(res.subscriptions || []);
        }
      },
      error: (err) => {
        console.error('Error fetching subscriptions', err);
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

  getInvoiceNumber(service: any): string {
    if (!service || !service.updatedAt) return 'WE-0000000000';
    const d = new Date(service.updatedAt);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `WE${yy}${mm}${dd}${hh}${min}`;
  }

  formatTitleCase(text: string): string {
    if (!text) return text;
    const lowerWords = ['of', 'and', 'is', 'in', 'on', 'at', 'to', 'for', 'a', 'an'];
    return text.toLowerCase().split(' ').map((word, index) => {
      if (index > 0 && lowerWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  isPaymentPending(service: any): boolean {
    const closed = service.dealClosedAmount || 0;
    const paid = service.advanceAmountPaid || 0;
    return closed > paid;
  }

  async renewSubscription(subId: string) {
    try {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Renew Subscription',
        message: 'Are you sure you want to renew this subscription for another year?',
        confirmText: 'Renew',
        cancelText: 'Cancel'
      });
      if (!confirmed) return;
      
      this.isLoading.set(true);
      this.api.post<any>(`subscriptions/renew/${subId}`, {}).subscribe({
        next: (res) => {
          if (res.success) {
            this.fetchActiveSubscriptions();
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to renew', err);
          this.isLoading.set(false);
        }
      });
    } catch(e) {
      this.isLoading.set(false);
    }
  }
}
