import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-gst-cancellation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './gst-cancellation-form.html',
  styleUrl: './gst-cancellation-form.css',
})
export class GstCancellationForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Step 1: Business Details
  businessName = '';
  gstin = '';
  entityType = '';
  mobileNumber = '';
  emailId = '';

  // Step 2: Cancellation Details
  reasonForCancellation = '';
  effectiveCancellationDate = '';

  // Step 3: Document Uploads
  gstCertFile?: File;
  panCardFile?: File;
  supportDocsFile?: File;

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
        if (draft.gstin !== undefined) this.gstin = draft.gstin;
        if (draft.entityType !== undefined) this.entityType = draft.entityType;
        if (draft.mobileNumber !== undefined) this.mobileNumber = draft.mobileNumber;
        if (draft.emailId !== undefined) this.emailId = draft.emailId;
        if (draft.reasonForCancellation !== undefined) this.reasonForCancellation = draft.reasonForCancellation;
        if (draft.effectiveCancellationDate !== undefined) this.effectiveCancellationDate = draft.effectiveCancellationDate;
      }
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Upload a file less than 2 MB.');
      return;
    }

    if (fieldName === 'gstCert') this.gstCertFile = file;
    else if (fieldName === 'panCard') this.panCardFile = file;
    else if (fieldName === 'supportDocs') this.supportDocsFile = file;
  }

  goBack() {
    this.location.back();
  }

  
  saveDraft() {
    const draftData = {
      businessName: this.businessName,
      gstin: this.gstin,
      entityType: this.entityType,
      mobileNumber: this.mobileNumber,
      emailId: this.emailId,
      reasonForCancellation: this.reasonForCancellation,
      effectiveCancellationDate: this.effectiveCancellationDate,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.businessName || !this.gstin || !this.entityType || !this.mobileNumber || !this.emailId ||
        !this.reasonForCancellation || !this.effectiveCancellationDate) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if (!this.gstCertFile || !this.panCardFile || !this.supportDocsFile) {
      this.errorMessage.set('Please upload all required documents.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    // Step 1
    formData.append('businessName', this.businessName);
    formData.append('gstin', this.gstin);
    formData.append('entityType', this.entityType);
    formData.append('mobileNumber', this.mobileNumber);
    formData.append('emailId', this.emailId);
    
    // Step 2
    formData.append('reasonForCancellation', this.reasonForCancellation);
    formData.append('effectiveCancellationDate', this.effectiveCancellationDate);

    // Files
    formData.append('gstCert', this.gstCertFile);
    formData.append('panCard', this.panCardFile);
    formData.append('supportDocs', this.supportDocsFile);

    this.api.post<any>(`orders/${this.orderId()}/submit-gst-cancellation-form`, formData).subscribe({
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
