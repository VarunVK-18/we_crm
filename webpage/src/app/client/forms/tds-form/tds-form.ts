import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

@Component({
  selector: 'app-tds-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tds-form.html',
  styleUrl: './tds-form.css',
})
export class TdsForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
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

    if (fieldName === 'panCard') this.panCardFile = file;
    else if (fieldName === 'addressProof') this.addressProofFile = file;
    else if (fieldName === 'businessAddressProof') this.businessAddressProofFile = file;
    else if (fieldName === 'incorpCert') this.incorpCertFile = file;
  }

  goBack() {
    this.location.back();
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
          alert('TAN details submitted successfully!');
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
