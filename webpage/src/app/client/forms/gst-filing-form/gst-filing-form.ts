import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

@Component({
  selector: 'app-gst-filing-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gst-filing-form.html',
  styleUrl: './gst-filing-form.css',
})
export class GstFilingForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Step 1: Business Details
  businessName = '';
  gstin = '';
  legalName = '';

  // Step 2: Filing Period
  returnType = '';
  filingMonth = '';
  filingQuarter = '';
  financialYear = '';

  // Step 3: Document Uploads
  salesReportFile?: File;
  purchaseReportFile?: File;
  gstInvoicesFile?: File;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
    });
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Upload a file less than 2 MB.');
      return;
    }

    if (fieldName === 'salesReport') this.salesReportFile = file;
    else if (fieldName === 'purchaseReport') this.purchaseReportFile = file;
    else if (fieldName === 'gstInvoices') this.gstInvoicesFile = file;
  }

  goBack() {
    this.location.back();
  }

  submitForm() {
    if (!this.businessName || !this.gstin || !this.legalName || !this.returnType || !this.financialYear) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if (!this.salesReportFile || !this.purchaseReportFile || !this.gstInvoicesFile) {
      this.errorMessage.set('Please upload all required documents.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    // Step 1
    formData.append('businessName', this.businessName);
    formData.append('gstin', this.gstin);
    formData.append('legalName', this.legalName);
    
    // Step 2
    formData.append('returnType', this.returnType);
    formData.append('month', this.filingMonth);
    formData.append('quarter', this.filingQuarter);
    formData.append('financialYear', this.financialYear);

    // Files
    formData.append('salesReport', this.salesReportFile);
    formData.append('purchaseReport', this.purchaseReportFile);
    formData.append('gstInvoices', this.gstInvoicesFile);

    this.api.post<any>(`orders/${this.orderId()}/submit-gst-filing-form`, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.order) {
          alert('GST Filing details submitted successfully!');
          this.router.navigate(['/client/service', this.orderId()]);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
