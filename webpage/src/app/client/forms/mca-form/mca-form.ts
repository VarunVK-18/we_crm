import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-mca-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mca-form.html',
  styleUrls: ['./mca-form.css']
})
export class McaFormComponent implements OnInit {
  orderId = signal<string | null>(null);
  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');

  username = '';
  password = '';

  coiFile: File | null = null;
  panFile: File | null = null;
  moaFile: File | null = null;
  aoaFile: File | null = null;
  bankStatementFile: File | null = null;
  salesInvoiceFile: File | null = null;
  purchaseBillsFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private api: Api
  ,
    private draftService: DraftService) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.orderId.set(params.get('id'));
    });
  }

  goBack() {
    this.location.back();
  }

  onFileSelected(event: any, field: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should not exceed 5 MB.');
      event.target.value = '';
      return;
    }

    if (field === 'coi') this.coiFile = file;
    else if (field === 'pan') this.panFile = file;
    else if (field === 'moa') this.moaFile = file;
    else if (field === 'aoa') this.aoaFile = file;
    else if (field === 'bankStatement') this.bankStatementFile = file;
    else if (field === 'salesInvoice') this.salesInvoiceFile = file;
    else if (field === 'purchaseBills') this.purchaseBillsFile = file;
  }

  submitDetails() {
    if (!this.orderId()) return;

    if (!this.coiFile || !this.panFile || !this.moaFile || !this.aoaFile || !this.bankStatementFile || !this.salesInvoiceFile || !this.purchaseBillsFile) {
      this.errorMessage.set('Please upload all the required documents.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('mcaUsername', this.username);
    formData.append('mcaPassword', this.password);

    if (this.coiFile) formData.append('coi', this.coiFile);
    if (this.panFile) formData.append('pan', this.panFile);
    if (this.moaFile) formData.append('moa', this.moaFile);
    if (this.aoaFile) formData.append('aoa', this.aoaFile);
    if (this.bankStatementFile) formData.append('bankStatement', this.bankStatementFile);
    if (this.salesInvoiceFile) formData.append('salesInvoice', this.salesInvoiceFile);
    if (this.purchaseBillsFile) formData.append('purchaseBills', this.purchaseBillsFile);

    this.api.post<any>(`orders/${this.orderId()}/submit-mca-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        if (res && res.success !== false) {
          alert('MCA Compliance details submitted successfully!');
        this.draftService.clearDraft(this.orderId(), this.constructor.name);
          this.router.navigate(['/client/dashboard']);
        } else {
          this.errorMessage.set(res.message || 'Failed to submit form.');
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
