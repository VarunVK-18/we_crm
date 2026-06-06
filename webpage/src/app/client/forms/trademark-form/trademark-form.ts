import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

@Component({
  selector: 'app-trademark-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trademark-form.html',
  styleUrl: './trademark-form.css',
})
export class TrademarkForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
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
      alert('File size is large. Max 2MB allowed.');
      return;
    }

    if (fieldName === 'udyamCert') this.udyamCertFile = file;
    else if (fieldName === 'trademarkLogo') this.trademarkLogoFile = file;
    else if (fieldName === 'signature') this.signatureFile = file;
  }

  goBack() {
    this.location.back();
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
          alert('Trademark details submitted successfully!');
          this.router.navigate(['/client/service', this.orderId()]);
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
