import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

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
        if (draft.dateOfIncorporation !== undefined) this.dateOfIncorporation = draft.dateOfIncorporation;
        if (draft.businessAddress !== undefined) this.businessAddress = draft.businessAddress;
        if (draft.state !== undefined) this.state = draft.state;
        if (draft.pinCode !== undefined) this.pinCode = draft.pinCode;
        if (draft.signatoryName !== undefined) this.signatoryName = draft.signatoryName;
        if (draft.signatoryDesignation !== undefined) this.signatoryDesignation = draft.signatoryDesignation;
        if (draft.signatoryMobile !== undefined) this.signatoryMobile = draft.signatoryMobile;
        if (draft.signatoryEmail !== undefined) this.signatoryEmail = draft.signatoryEmail;
        if (draft.numberOfEmployees !== undefined) this.numberOfEmployees = draft.numberOfEmployees;
        if (draft.employeeDetails !== undefined) this.employeeDetails = draft.employeeDetails;
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
    else if (fieldName === 'businessAddressProof') this.businessAddressProofFile = file;
    else if (fieldName === 'incorpCert') this.incorpCertFile = file;
    else if (fieldName === 'cancelledCheque') this.cancelledChequeFile = file;
    else if (fieldName === 'authSignatoryProof') this.authSignatoryProofFile = file;
  }

  goBack() {
    this.location.back();
  }

  
  saveDraft() {
    const draftData = {
      businessName: this.businessName,
      entityType: this.entityType,
      panNumber: this.panNumber,
      dateOfIncorporation: this.dateOfIncorporation,
      businessAddress: this.businessAddress,
      state: this.state,
      pinCode: this.pinCode,
      signatoryName: this.signatoryName,
      signatoryDesignation: this.signatoryDesignation,
      signatoryMobile: this.signatoryMobile,
      signatoryEmail: this.signatoryEmail,
      numberOfEmployees: this.numberOfEmployees,
      employeeDetails: this.employeeDetails,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
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
        this.draftService.clearDraft(this.orderId(), this.constructor.name);
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
