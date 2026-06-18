import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-tds-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './tds-form.html',
  styleUrl: './tds-form.css',
})
export class TdsForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Form Fields
  entityType = '';
  businessName = '';
  panNumber = '';
  mobileNumber = '';
  emailId = '';
  businessAddress = '';

  // Document Uploads
  panCardFile?: File;
  addressProofFile?: File;
  businessAddressProofFile?: File;
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
        if (draft.entityType !== undefined) this.entityType = draft.entityType;
        if (draft.businessName !== undefined) this.businessName = draft.businessName;
        if (draft.panNumber !== undefined) this.panNumber = draft.panNumber;
        if (draft.mobileNumber !== undefined) this.mobileNumber = draft.mobileNumber;
        if (draft.emailId !== undefined) this.emailId = draft.emailId;
        if (draft.businessAddress !== undefined) this.businessAddress = draft.businessAddress;
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
    else if (fieldName === 'businessAddressProof') this.businessAddressProofFile = file;
    else if (fieldName === 'incorpCert') this.incorpCertFile = file;
  }

  goBack() {
    this.location.back();
  }

  
  saveDraft() {
    const draftData = {
      entityType: this.entityType,
      businessName: this.businessName,
      panNumber: this.panNumber,
      mobileNumber: this.mobileNumber,
      emailId: this.emailId,
      businessAddress: this.businessAddress,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.entityType || !this.businessName || !this.panNumber || !this.mobileNumber || !this.emailId || !this.businessAddress) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if (!this.panCardFile || !this.addressProofFile || !this.businessAddressProofFile) {
      this.errorMessage.set('Please upload all required documents.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('entityType', this.entityType);
    formData.append('businessName', this.businessName);
    formData.append('panNumber', this.panNumber);
    formData.append('mobileNumber', this.mobileNumber);
    formData.append('emailId', this.emailId);
    formData.append('businessAddress', this.businessAddress);

    // Files
    formData.append('panCard', this.panCardFile);
    formData.append('addressProof', this.addressProofFile);
    formData.append('businessAddressProof', this.businessAddressProofFile);
    if (this.incorpCertFile) {
      formData.append('incorpCert', this.incorpCertFile);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-tds-form`, formData).subscribe({
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
