import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  CustomerSupportIcon,
  BubbleChatIcon,
  CallOutgoing01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CallIcon,
  Mail01Icon,
  Call02Icon,
  MailOpenIcon,
  Ticket01Icon,
  Calendar02Icon,
  Search01Icon,
  File01Icon,
  CheckmarkBadge01Icon,
  Time01Icon
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-help-support',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './client-help-support.html',
  styleUrl: './client-help-support.css'
})
export class ClientHelpSupport implements OnInit {
  user = signal<any>(null);
  clientManager = signal<any>(null);
  isLoadingManager = signal<boolean>(true);

  // KPI State
  tickets = signal<any[]>([]);
  activeOrders = signal<any[]>([]);
  completedOrders = signal<any[]>([]);
  showCompletedServicesModal = signal(false);

  // Computed KPIs
  openTicketsCount = computed(() => this.tickets().filter(t => t.status === 'Pending' || t.status === 'In Progress').length);
  resolvedTicketsCount = computed(() => this.tickets().filter(t => t.status === 'Resolved').length);
  pendingDocsCount = computed(() => {
    let count = 0;
    for (const order of this.activeOrders()) {
      if (order.items) {
        count += order.items.filter((i: any) => !i.isChecked).length;
      }
    }
    return count;
  });

  constructor(private router: Router, public api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.user.set(JSON.parse(savedUser));
    this.fetchClientManager();
    this.fetchTickets();
    this.fetchOrders();
  }

  fetchClientManager() {
    const u = this.user();
    if (!u) return;

    // Check if manager is already populated in the local user object
    if (u.client_manager && typeof u.client_manager === 'object' && (u.client_manager.name || u.client_manager.owner_name)) {
      this.clientManager.set(u.client_manager);
      this.isLoadingManager.set(false);
      return; // Skip fetch if we already have it
    } else if (u.assigned_to && typeof u.assigned_to === 'object' && (u.assigned_to.name || u.assigned_to.owner_name)) {
      this.clientManager.set(u.assigned_to);
      this.isLoadingManager.set(false);
      return; // Skip fetch if we already have it
    }

    this.isLoadingManager.set(true);
    const uid = u._id || u.id;
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

  fetchTickets() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    this.api.get<any>(`tickets/user/${uid}`).subscribe({
      next: (res) => {
        if (res && res.tickets) {
          this.tickets.set(res.tickets);
        }
      },
      error: (err) => console.error('Failed to fetch tickets:', err)
    });
  }

  fetchOrders() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        const active: any[] = [];
        const completed: any[] = [];
        for (const c of checklists) {
          if (c.status === 'completed') {
            completed.push(c);
          } else if (c.assigned_to && c.assigned_to.role !== 'client_manager') {
            active.push(c);
          }
        }
        this.activeOrders.set(active);
        this.completedOrders.set(completed);
      },
      error: (err) => console.error('Failed to fetch orders:', err)
    });
  }
  // Icons
  CustomerSupportIcon = CustomerSupportIcon;
  BubbleChatIcon = BubbleChatIcon;
  CallOutgoing01Icon = CallOutgoing01Icon;
  ArrowDown01Icon = ArrowDown01Icon;
  ArrowUp01Icon = ArrowUp01Icon;
  CallIcon = CallIcon;
  Mail01Icon = Mail01Icon;
  Call02Icon = Call02Icon;
  MailOpenIcon = MailOpenIcon;
  Ticket01Icon = Ticket01Icon;
  Calendar02Icon = Calendar02Icon;
  Search01Icon = Search01Icon;
  File01Icon = File01Icon;
  CheckmarkBadge01Icon = CheckmarkBadge01Icon;
  Time01Icon = Time01Icon;

  faqs = [
    {
      question: 'What is Startup Doctor?',
      answer: 'Startup Doctor is an all-in-one platform to manage your business compliances, legal documents, certifications, and important deadlines in one secure place.',
      isOpen: false,
      category: 'General'
    },
    {
      question: 'What can I manage with Startup Doctor?',
      answer: 'You can track GST, ITR, IP, licenses, certifications, subscriptions, statutory filings, and securely store all your business documents.',
      isOpen: false,
      category: 'Services'
    },
    {
      question: 'Will I receive reminders for compliance deadlines?',
      answer: 'Yes. Startup Doctor sends timely reminders for upcoming filings, renewals, and compliance due dates to help you stay on track.',
      isOpen: false,
      category: 'Services'
    },
    {
      question: 'Is my business data secure?',
      answer: 'Yes. Your documents and business information are protected using secure encryption and industry-standard security practices.',
      isOpen: false,
      category: 'General'
    },
    {
      question: 'Can I access my documents anytime?',
      answer: 'Yes. You can securely access your documents and compliance information anytime, anywhere from your Startup Doctor account.',
      isOpen: false,
      category: 'General'
    },
    {
      question: 'How does Startup Doctor protect my business information?',
      answer: 'Startup Doctor follows AICPA SOC, GDPR, and ISO standards to keep your business data secure.',
      isOpen: false,
      category: 'General'
    }
  ];

  activeCategory = signal<string>('All');

  filteredFaqs = computed(() => {
    const category = this.activeCategory();
    if (category === 'All') return this.faqs;
    return this.faqs.filter(faq => faq.category === category);
  });

  setCategory(cat: string) {
    this.activeCategory.set(cat);
  }

  toggleFaq(faq: any) {
    faq.isOpen = !faq.isOpen;
  }

  getSupportPhone(): string {
    const manager = this.clientManager();
    if (manager && manager.phone) {
      let phone = manager.phone.replace(/[^\d+]/g, '');
      if (phone.length === 10) {
        phone = '91' + phone;
      }
      if (phone.length > 0) return phone;
    }
    return '918072286963';
  }

  openWhatsApp() {
    let phone = this.getSupportPhone();
    phone = phone.replace('+', '');
    const message = 'Hi Wealth Empires Support, I need help with...';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  openLiveChat() {
    this.showCompletedServicesModal.set(true);
  }

  closeLiveChatModal() {
    this.showCompletedServicesModal.set(false);
  }

  goToServiceChat(order: any) {
    this.showCompletedServicesModal.set(false);
    this.router.navigate(['/client/service', order._id || order.id], { queryParams: { chat: 'open' } });
  }

  callSupport() {
    let phone = this.getSupportPhone();
    if (!phone.startsWith('+') && phone.length >= 10) {
      phone = '+' + phone;
    }
    window.location.href = `tel:${phone}`;
  }
}
