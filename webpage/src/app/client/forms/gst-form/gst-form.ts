import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

@Component({
  selector: 'app-gst-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gst-form.html',
  styleUrl: './gst-form.css',
})
export class GstForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Trade Details
  tradeName = '';
  commenceDate = '';
  businessEmail = '';
  businessPhone = '';

  // Personal Information
  fullName = '';
  fatherName = '';
  dob = '';
  personalPhone = '';
  personalEmail = '';
  gender = 'Male';
  din = '';
  pan = '';
  residentialAddress = '';
  
  photoFile?: File;

  // Business Details
  businessAddress = '';
  district = '';
  premisesType = 'Own';
  
  ebBillFile?: File;
  houseTaxReceiptFile?: File;
  rentalAgreementFile?: File;

  // Bank Details
  accountNumber = '';
  ifscCode = '';
  branch = '';

  isDeclared = false;

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
      alert('Upload a file less than 2 MB or equal to 2 MB.');
      return;
    }

    if (fieldName === 'photo') this.photoFile = file;
    else if (fieldName === 'ebBill') this.ebBillFile = file;
    else if (fieldName === 'houseTaxReceipt') this.houseTaxReceiptFile = file;
    else if (fieldName === 'rentalAgreement') this.rentalAgreementFile = file;
  }

  goBack() {
    this.location.back();
  }

  submitForm() {
    if (!this.tradeName || !this.commenceDate || !this.businessEmail || !this.businessPhone ||
        !this.fullName || !this.fatherName || !this.dob || !this.personalPhone || !this.personalEmail ||
        !this.pan || !this.residentialAddress || !this.businessAddress || !this.district ||
        !this.accountNumber || !this.ifscCode || !this.branch) {
      this.errorMessage.set('Please fill all required text fields.');
      return;
    }

    if (!this.photoFile) {
      this.errorMessage.set('Please upload Photo.');
      return;
    }
    if (!this.ebBillFile) {
      this.errorMessage.set('Please upload Latest EB Bill.');
      return;
    }
    if (this.premisesType === 'Own' && !this.houseTaxReceiptFile) {
      this.errorMessage.set('Please upload House Tax Receipt.');
      return;
    }
    if (this.premisesType === 'Rent' && !this.rentalAgreementFile) {
      this.errorMessage.set('Please upload Rental Agreement.');
      return;
    }

    if (!this.isDeclared) {
      this.errorMessage.set('Please check the declaration checkbox.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('tradeName', this.tradeName);
    formData.append('commenceDate', this.commenceDate);
    formData.append('businessEmail', this.businessEmail);
    formData.append('businessPhone', this.businessPhone);
    
    formData.append('fullName', this.fullName);
    formData.append('fatherName', this.fatherName);
    formData.append('dob', this.dob);
    formData.append('personalPhone', this.personalPhone);
    formData.append('personalEmail', this.personalEmail);
    formData.append('gender', this.gender);
    formData.append('din', this.din);
    formData.append('pan', this.pan);
    formData.append('residentialAddress', this.residentialAddress);
    
    formData.append('businessAddress', this.businessAddress);
    formData.append('district', this.district);
    formData.append('premisesType', this.premisesType);
    
    formData.append('accountNumber', this.accountNumber);
    formData.append('ifscCode', this.ifscCode);
    formData.append('branch', this.branch);

    formData.append('photo', this.photoFile as File);
    formData.append('ebBill', this.ebBillFile as File);
    if (this.premisesType === 'Own' && this.houseTaxReceiptFile) {
      formData.append('houseTaxReceipt', this.houseTaxReceiptFile as File);
    } else if (this.premisesType === 'Rent' && this.rentalAgreementFile) {
      formData.append('rentalAgreement', this.rentalAgreementFile as File);
    }

    this.api.post(`orders/${this.orderId()}/submit-gst-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          alert('GST details submitted successfully!');
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
