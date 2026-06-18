import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-lei-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './lei-form.html',
  styleUrl: './lei-form.css',
})
export class LeiForm implements OnInit {
  orderId = signal<string>('');
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Company Details
  companyLegalName = '';
  companyAddress = '';
  applicantName = '';
  email = '';
  whatsapp = '';
  courierAddress = '';

  isVerified = false;

  // Files
  msmeCertFile?: File;
  addressProofFile?: File;
  incorpCertFile?: File;
  panCardFile?: File;
  gstCertFile?: File;
  auditedFinancialsFile?: File;
  moaAoaFile?: File;
  boardResolutionFile?: File;

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
        if (draft.companyLegalName !== undefined) this.companyLegalName = draft.companyLegalName;
        if (draft.companyAddress !== undefined) this.companyAddress = draft.companyAddress;
        if (draft.applicantName !== undefined) this.applicantName = draft.applicantName;
        if (draft.email !== undefined) this.email = draft.email;
        if (draft.whatsapp !== undefined) this.whatsapp = draft.whatsapp;
        if (draft.courierAddress !== undefined) this.courierAddress = draft.courierAddress;
      }
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Upload a file less than 2 MB.');
      event.target.value = '';
      return;
    }
    switch (fieldName) {
      case 'msmeCertificate': this.msmeCertFile = file; break;
      case 'addressProof': this.addressProofFile = file; break;
      case 'incorpCert': this.incorpCertFile = file; break;
      case 'panCard': this.panCardFile = file; break;
      case 'gstCert': this.gstCertFile = file; break;
      case 'auditedFinancials': this.auditedFinancialsFile = file; break;
      case 'moaAoa': this.moaAoaFile = file; break;
      case 'boardResolution': this.boardResolutionFile = file; break;
    }
  }

  goBack() {
    this.location.back();
  }

  
  saveDraft() {
    const draftData = {
      companyLegalName: this.companyLegalName,
      companyAddress: this.companyAddress,
      applicantName: this.applicantName,
      email: this.email,
      whatsapp: this.whatsapp,
      courierAddress: this.courierAddress,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.companyLegalName || !this.companyAddress || !this.applicantName || !this.email || !this.whatsapp || !this.courierAddress) {
      this.errorMessage.set('Please fill all required text fields.');
      return;
    }

    if (!this.isVerified) {
      this.errorMessage.set('Please check the verification checkbox.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('companyLegalName', this.companyLegalName);
    formData.append('companyAddress', this.companyAddress);
    formData.append('applicantName', this.applicantName);
    formData.append('email', this.email);
    formData.append('whatsapp', this.whatsapp);
    formData.append('courierAddress', this.courierAddress);

    // Attach files
    if (this.msmeCertFile) formData.append('msmeCertificate', this.msmeCertFile);
    if (this.addressProofFile) formData.append('addressProof', this.addressProofFile);
    if (this.incorpCertFile) formData.append('incorpCert', this.incorpCertFile);
    if (this.panCardFile) formData.append('panCard', this.panCardFile);
    if (this.gstCertFile) formData.append('gstCert', this.gstCertFile);
    if (this.auditedFinancialsFile) formData.append('auditedFinancials', this.auditedFinancialsFile);
    if (this.moaAoaFile) formData.append('moaAoa', this.moaAoaFile);
    if (this.boardResolutionFile) formData.append('boardResolution', this.boardResolutionFile);

    this.api.post(`orders/${this.orderId()}/submit-lei-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
          this.draftService.clearDraft(this.orderId(), this.constructor.name);
          setTimeout(() => {
            this.router.navigate(['/client/service', this.orderId()]);
          }, 2000);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form. Please try again.');
      }
    });
  }
}
