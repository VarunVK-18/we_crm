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

  // KPI State
  tickets = signal<any[]>([]);
  activeOrders = signal<any[]>([]);

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

  constructor(private router: Router, private api: Api) {}

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
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res) => {
        if (res.user && res.user.client_manager) {
          this.clientManager.set(res.user.client_manager);
        } else if (res.user && res.user.assigned_to) {
          this.clientManager.set(res.user.assigned_to);
        }
      },
      error: (err) => console.error('Failed to fetch client manager:', err)
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
        for (const c of checklists) {
          if (c.status !== 'completed' && c.assigned_to && c.assigned_to.role !== 'client_manager') {
            active.push(c);
          }
        }
        this.activeOrders.set(active);
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
      question: 'How long does DSC registration take?',
      answer: 'DSC registration typically takes 1-2 business days after all necessary documents are verified and processed.',
      isOpen: false
    },
    {
      question: 'Can I change my company name after search?',
      answer: 'If the name hasn\'t been formally registered yet, you can do a new name search. If already registered, a formal name change process with MCA must be initiated.',
      isOpen: false
    },
    {
      question: 'What documents are needed for GST filing?',
      answer: 'You will generally need your PAN card, Aadhaar card, business registration proof, bank statements, and relevant sales/purchase invoices.',
      isOpen: false
    },
    {
      question: 'How do I upgrade my service plan?',
      answer: 'You can upgrade your plan at any time from the Subscriptions page by selecting a new tier, and the prorated difference will be applied.',
      isOpen: false
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, UPI, net banking, and standard digital wallets for your convenience.',
      isOpen: false
    },
    {
      question: 'How can I track my application status?',
      answer: 'You can monitor real-time progress for all your active applications in the "Ongoing Services" section of your dashboard.',
      isOpen: false
    },
    {
      question: 'How do I update my profile details?',
      answer: 'Go to your Profile page to update your contact information, address, and business details at any time.',
      isOpen: false
    }
  ];

  toggleFaq(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  openWhatsApp() {
    const phone = '918072286963';
    const message = 'Hi Wealth Empires Support, I need help with...';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  callSupport() {
    window.location.href = 'tel:+918072286963';
  }
}
