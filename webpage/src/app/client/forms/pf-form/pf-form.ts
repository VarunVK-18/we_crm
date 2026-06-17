import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

@Component({
  selector: 'app-pf-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pf-form.html',
  styleUrl: './pf-form.css',
})
export class PfForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Step 1: Business Details
  businessName = '';
  entityType = '';
  panNumber = '';
  dateOfIncorporation = '';
  businessAddress = '';
  state = '';
  pinCode = '';

  // Step 2: Authorized Signatory Details
  signatoryName = '';
  signatoryDesignation = '';
  signatoryMobile = '';
  signatoryEmail = '';

  // Step 3: Employee Information
  numberOfEmployees = '';
  employeeDetails = ''; // Optional

  // Document Uploads
  panCardFile?: File;
  businessAddressProofFile?: File;
  incorpCertFile?: File;
  cancelledChequeFile?: File;
  authSignatoryProofFile?: File;

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
    else if (fieldName === 'businessAddressProof') this.businessAddressProofFile = file;
    else if (fieldName === 'incorpCert') this.incorpCertFile = file;
    else if (fieldName === 'cancelledCheque') this.cancelledChequeFile = file;
    else if (fieldName === 'authSignatoryProof') this.authSignatoryProofFile = file;
  }

  goBack() {
    this.location.back();
  }

  submitForm() {
    if (!this.businessName || !this.entityType || !this.panNumber || !this.dateOfIncorporation || 
        !this.businessAddress || !this.state || !this.pinCode || !this.signatoryName || 
        !this.signatoryDesignation || !this.signatoryMobile || !this.signatoryEmail || !this.numberOfEmployees) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if (!this.panCardFile || !this.businessAddressProofFile || !this.cancelledChequeFile || !this.authSignatoryProofFile) {
      this.errorMessage.set('Please upload all required documents.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('businessName', this.businessName);
    formData.append('entityType', this.entityType);
    formData.append('panNumber', this.panNumber);
    formData.append('dateOfIncorporation', this.dateOfIncorporation);
    formData.append('businessAddress', this.businessAddress);
    formData.append('state', this.state);
    formData.append('pinCode', this.pinCode);
    
    formData.append('signatoryName', this.signatoryName);
    formData.append('signatoryDesignation', this.signatoryDesignation);
    formData.append('signatoryMobile', this.signatoryMobile);
    formData.append('signatoryEmail', this.signatoryEmail);
    
    formData.append('numberOfEmployees', this.numberOfEmployees);
    if (this.employeeDetails) formData.append('employeeDetails', this.employeeDetails);

    // Files
    formData.append('panCard', this.panCardFile);
    formData.append('businessAddressProof', this.businessAddressProofFile);
    formData.append('cancelledCheque', this.cancelledChequeFile);
    formData.append('authSignatoryProof', this.authSignatoryProofFile);
    if (this.incorpCertFile) {
      formData.append('incorpCert', this.incorpCertFile);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-pf-form`, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.order) {
          alert('PF details submitted successfully!');
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
