import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  ArrowLeft01Icon,
  Download01Icon,
  Share01Icon
} from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-client-invoice',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent, DatePipe, CurrencyPipe, WeLoaderComponent],
  templateUrl: './client-invoice.html',
  styleUrl: './client-invoice.css'
})
export class ClientInvoice implements OnInit {
  user = signal<any>(null);
  order = signal<any>(null);
  isLoading = signal(true);
  cgstRate = signal(9);  // default 9%
  sgstRate = signal(9);  // default 9%

  // Icons
  ArrowLeft01Icon = ArrowLeft01Icon;
  Download01Icon = Download01Icon;
  Share01Icon = Share01Icon;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: Api
  ) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
      // Fetch company settings for tax rates
      this.api.get<any>('settings').subscribe({
        next: (res) => {
          if (res?.success && res.settings) {
            const cgst = res.settings.cgst_percentage ?? 9;
            this.cgstRate.set(cgst);
            this.sgstRate.set(cgst); // SGST = CGST
          }
        },
        error: () => {} // Use defaults on error
      });
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.fetchInvoice(id);
        } else {
          this.router.navigate(['/client/subscriptions']);
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  shareInvoice() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Wealth Empires Digital Invoice',
        text: 'View my official digital invoice here:',
        url: url
      }).catch(err => console.error('Share failed:', err));
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Invoice link copied to clipboard!');
      });
    }
  }

  fetchInvoice(id: string) {
    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        const found = checklists.find((c: any) => c._id === id || c.id === id);
        if (found) {
          this.order.set(found);
        } else {
          console.error('Invoice not found');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching invoice details', err);
        this.isLoading.set(false);
      }
    });
  }

  get invoiceNumber(): string {
    const o = this.order();
    if (!o || !o.updatedAt) return '#WE-0000000000';
    const d = new Date(o.updatedAt);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `#WE${yy}${mm}${dd}${hh}${min}`;
  }

  get servicePrice(): number {
    const o = this.order();
    if (!o) return 0;
    return o.dealClosedAmount > 0 ? o.dealClosedAmount : 4999.00;
  }

  get cgst(): number {
    return this.servicePrice * (this.cgstRate() / 100);
  }

  get sgst(): number {
    return this.servicePrice * (this.sgstRate() / 100);
  }

  get total(): number {
    return this.servicePrice + this.cgst + this.sgst;
  }

  goBack() {
    this.router.navigate(['/client/subscriptions']);
  }

  downloadPdf() {
    window.print();
  }
}
