import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-trademark-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './trademark-form.html',
  styleUrl: './trademark-form.css',
})
export class TrademarkForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Form Fields
  companyName = '';
  udyamNumber = '';
  applicantName = '';
  companyAddress = '';
  companyMobile = '';
  companyEmail = '';
  partnersName = '';
  businessDescription = '';
  dateFirstUsed = '';
  nameOfApplicant = '';

  // Radio Fields
  msmeType = 'Micro';
  tradeDescription = 'Goods';
  categoryOfMark = 'Word mark (it includes one or more words, letters, numerals or anything written in standard character)';

  isVerified = false;

  // File Fields
  udyamCertFile?: File;
  trademarkLogoFile?: File;
  signatureFile?: File;

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
        if (draft.companyName !== undefined) this.companyName = draft.companyName;
        if (draft.udyamNumber !== undefined) this.udyamNumber = draft.udyamNumber;
        if (draft.applicantName !== undefined) this.applicantName = draft.applicantName;
        if (draft.companyAddress !== undefined) this.companyAddress = draft.companyAddress;
        if (draft.companyMobile !== undefined) this.companyMobile = draft.companyMobile;
        if (draft.companyEmail !== undefined) this.companyEmail = draft.companyEmail;
        if (draft.partnersName !== undefined) this.partnersName = draft.partnersName;
        if (draft.businessDescription !== undefined) this.businessDescription = draft.businessDescription;
        if (draft.dateFirstUsed !== undefined) this.dateFirstUsed = draft.dateFirstUsed;
        if (draft.nameOfApplicant !== undefined) this.nameOfApplicant = draft.nameOfApplicant;
        if (draft.msmeType !== undefined) this.msmeType = draft.msmeType;
        if (draft.tradeDescription !== undefined) this.tradeDescription = draft.tradeDescription;
        if (draft.categoryOfMark !== undefined) this.categoryOfMark = draft.categoryOfMark;
      }
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Upload a file less than 2 MB or equal to 2 MB.');
      return;
    }

    if (fieldName === 'udyamCert') this.udyamCertFile = file;
    else if (fieldName === 'trademarkLogo') this.trademarkLogoFile = file;
    else if (fieldName === 'signature') this.signatureFile = file;
  }

  goBack() {
    this.location.back();
  }

  
  saveDraft() {
    const draftData = {
      companyName: this.companyName,
      udyamNumber: this.udyamNumber,
      applicantName: this.applicantName,
      companyAddress: this.companyAddress,
      companyMobile: this.companyMobile,
      companyEmail: this.companyEmail,
      partnersName: this.partnersName,
      businessDescription: this.businessDescription,
      dateFirstUsed: this.dateFirstUsed,
      nameOfApplicant: this.nameOfApplicant,
      msmeType: this.msmeType,
      tradeDescription: this.tradeDescription,
      categoryOfMark: this.categoryOfMark,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.companyName || !this.udyamNumber || !this.applicantName || !this.companyAddress || 
        !this.companyMobile || !this.companyEmail || !this.businessDescription || 
        !this.dateFirstUsed || !this.nameOfApplicant) {
      this.errorMessage.set('Please fill all required text fields.');
      return;
    }

    if (!this.udyamCertFile || !this.trademarkLogoFile || !this.signatureFile) {
      this.errorMessage.set('Please upload all required files (UDYAM Certificate, Trademark Logo, Signature).');
      return;
    }

    if (!this.isVerified) {
      this.errorMessage.set('Please accept the verification statement at the bottom.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('companyName', this.companyName);
    formData.append('udyamNumber', this.udyamNumber);
    formData.append('applicantName', this.applicantName);
    formData.append('companyAddress', this.companyAddress);
    formData.append('companyMobile', this.companyMobile);
    formData.append('companyEmail', this.companyEmail);
    formData.append('partnersName', this.partnersName);
    formData.append('businessDescription', this.businessDescription);
    formData.append('dateFirstUsed', this.dateFirstUsed);
    formData.append('nameOfApplicant', this.nameOfApplicant);

    formData.append('msmeType', this.msmeType);
    formData.append('tradeDescription', this.tradeDescription);
    formData.append('categoryOfMark', this.categoryOfMark);
    formData.append('isVerified', this.isVerified.toString());

    formData.append('udyamCert', this.udyamCertFile as File);
    formData.append('trademarkLogo', this.trademarkLogoFile as File);
    formData.append('signature', this.signatureFile as File);

    this.api.post(`orders/${this.orderId()}/submit-trademark-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          this.isSuccess.set(true);
          this.draftService.clearDraft(this.orderId(), this.constructor.name);
          setTimeout(() => {
            this.router.navigate(['/client/service', this.orderId()]);
          }, 2000);
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
