import { Component, signal, OnInit } from '@angular/core';

import { CommonModule, DatePipe, CurrencyPipe, Location } from '@angular/common';
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
  imports: [CommonModule, DatePipe],
  templateUrl: './client-invoice.html',
  styleUrl: './client-invoice.css'
})
export class ClientInvoice implements OnInit {
  qrDataUrl = signal<string>('');
  user = signal<any>(null);
  order = signal<any>(null);
  isLoading = signal(true);
  cgstRate = signal(9);  // default 9%
  sgstRate = signal(9);  // default 9%
  companyDetails = signal<any>({});
  bankDetails = signal<any>({});

  // Icons
  ArrowLeft01Icon = ArrowLeft01Icon;
  Download01Icon = Download01Icon;
  Share01Icon = Share01Icon;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: Api,
    private location: Location
  ) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
      // Fetch company settings for tax rates
      this.api.get<any>('settings').subscribe({
        next: (res) => {
          if (res?.success) {
            if (res.settings) {
              const cgst = res.settings.cgst_percentage ?? 9;
              this.cgstRate.set(cgst);
              this.sgstRate.set(cgst); // SGST = CGST
              this.bankDetails.set(res.settings.bank_details || {});
            }
            if (res.company) {
              this.companyDetails.set(res.company);
            }
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
          this.generateQr();
      },
      error: (err) => {
        console.error('Error fetching invoice details', err);
        this.isLoading.set(false);
          this.generateQr();
      }
    });
  }

  get invoiceNumber(): string {
    const o = this.order();
    const d = o?.createdAt ? new Date(o.createdAt) : new Date();

    if (o?.custom_service_id) {
      const numberPart = String(o.custom_service_id).replace(/\D/g, '');
      const year = d.getFullYear().toString();
      return `#WE${year}${numberPart}`;
    }
    if (!o || !o.createdAt) return '#WE-0000000000';
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
    const o = this.order();
    if (o && o.isGstApplicable === false) return 0;
    return this.servicePrice * (this.cgstRate() / 100);
  }

  get sgst(): number {
    const o = this.order();
    if (o && o.isGstApplicable === false) return 0;
    return this.servicePrice * (this.sgstRate() / 100);
  }

  get total(): number {
    return this.servicePrice + this.cgst + this.sgst;
  }

  goBack() {
    this.location.back();
  }

  formatMoney(amount: number): string {
    return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  numberToWords(num: number): string {
    if (num === 0) return 'Zero';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      const digit = n % 10;
      if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : ' ');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + inWords(n % 100));
      if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 === 0 ? '' : inWords(n % 1000));
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 === 0 ? '' : inWords(n % 100000));
      return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 === 0 ? '' : inWords(n % 10000000));
    };
    return inWords(Math.floor(num)).trim() + ' Rupees Only';
  }

  get items(): any[] {
    const o = this.order();
    if (!o) return [];
    return [{
      name: o.service_name || o.serviceName || 'Service / Product',
      sacHsn: '998311', // Default SAC for professional services
      rate: this.servicePrice,
      quantity: 1,
      taxableValue: this.servicePrice,
      cgstAmount: this.cgst,
      sgstAmount: this.sgst,
      total: this.total
    }];
  }

  get getTotalItemsQty(): number {
    return this.items.length;
  }

  
  generateQr() {
    if (!this.invoiceNumber) return;
    const url = 'https://wealthempires.com/invoice/' + this.invoiceNumber;
    this.qrDataUrl.set(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&margin=1&data=${encodeURIComponent(url)}`);
  }

  getGstBreakdown(): any[] {
    if (!this.order() || this.order().isGstApplicable === false) return [];
    return [{
      hsnSac: '998311',
      taxableValue: this.servicePrice,
      cgstRate: this.cgstRate(),
      cgstAmount: this.cgst,
      sgstRate: this.sgstRate(),
      sgstAmount: this.sgst,
      totalTax: this.cgst + this.sgst
    }];
  }

  downloadPdf() {
    window.print();
  }
}
