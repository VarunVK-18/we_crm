import { Component, signal, OnInit } from '@angular/core';
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
  Mail01Icon
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

  constructor(private router: Router, private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.user.set(JSON.parse(savedUser));
    this.fetchClientManager();
  }

  fetchClientManager() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    
    this.api.get<any>(`users/${uid}`).subscribe({
      next: (res) => {
        if (res.user && res.user.assigned_to) {
          this.clientManager.set(res.user.assigned_to);
        }
      },
      error: (err) => console.error('Failed to fetch client manager', err)
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
