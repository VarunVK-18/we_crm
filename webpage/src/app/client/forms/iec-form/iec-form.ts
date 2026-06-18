import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-iec-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './iec-form.html',
  styleUrl: './iec-form.css',
})
export class IecForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Step 1: Business Details
  businessName = '';
  entityType = '';
  panNumber = '';
  mobileNumber = '';
  emailId = '';
  businessAddress = '';

  // Step 2: Bank Details
  bankName = '';
  accountNumber = '';
  ifscCode = '';

  // Step 3: Document Uploads
  panCardFile?: File;
  addressProofFile?: File;
  cancelledChequeFile?: File;
  incorpCertFile?: File;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api
  ,
    private draftService: DraftService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
    });
      const draft = this.draftService.loadDraft(this.orderId(), this.constructor.name);
      if (draft) {
        if (draft.businessName !== undefined) this.businessName = draft.businessName;
        if (draft.entityType !== undefined) this.entityType = draft.entityType;
        if (draft.panNumber !== undefined) this.panNumber = draft.panNumber;
        if (draft.mobileNumber !== undefined) this.mobileNumber = draft.mobileNumber;
        if (draft.emailId !== undefined) this.emailId = draft.emailId;
        if (draft.businessAddress !== undefined) this.businessAddress = draft.businessAddress;
        if (draft.bankName !== undefined) this.bankName = draft.bankName;
        if (draft.accountNumber !== undefined) this.accountNumber = draft.accountNumber;
        if (draft.ifscCode !== undefined) this.ifscCode = draft.ifscCode;
      }
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Upload a file less than 2 MB.');
      return;
    }

    if (fieldName === 'panCard') this.panCardFile = file;
    else if (fieldName === 'addressProof') this.addressProofFile = file;
    else if (fieldName === 'cancelledCheque') this.cancelledChequeFile = file;
    else if (fieldName === 'incorpCert') this.incorpCertFile = file;
  }

  goBack() {
    this.location.back();
  }

  
  saveDraft() {
    const draftData = {
      businessName: this.businessName,
      entityType: this.entityType,
      panNumber: this.panNumber,
      mobileNumber: this.mobileNumber,
      emailId: this.emailId,
      businessAddress: this.businessAddress,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      ifscCode: this.ifscCode,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.businessName || !this.entityType || !this.panNumber || !this.mobileNumber || !this.emailId || !this.businessAddress ||
        !this.bankName || !this.accountNumber || !this.ifscCode) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if (!this.panCardFile || !this.addressProofFile || !this.cancelledChequeFile) {
      this.errorMessage.set('Please upload all required documents (PAN, Address Proof, Cancelled Cheque).');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    // Step 1
    formData.append('businessName', this.businessName);
    formData.append('entityType', this.entityType);
    formData.append('panNumber', this.panNumber);
    formData.append('mobileNumber', this.mobileNumber);
    formData.append('emailId', this.emailId);
    formData.append('businessAddress', this.businessAddress);
    
    // Step 2
    formData.append('bankName', this.bankName);
    formData.append('accountNumber', this.accountNumber);
    formData.append('ifscCode', this.ifscCode);

    // Files
    formData.append('panCard', this.panCardFile);
    formData.append('addressProof', this.addressProofFile);
    formData.append('cancelledCheque', this.cancelledChequeFile);
    if (this.incorpCertFile) {
      formData.append('incorpCert', this.incorpCertFile);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-iec-form`, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.order) {
          this.isSuccess.set(true);
          this.draftService.clearDraft(this.orderId(), this.constructor.name);
          setTimeout(() => {
            this.router.navigate(['/client/service', this.orderId()]);
          }, 2000);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
