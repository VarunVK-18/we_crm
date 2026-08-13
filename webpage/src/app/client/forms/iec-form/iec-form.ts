import { AutoFillUtils } from '../../../utils/autofill-utils';
import { DocumentMatcher } from '../../../utils/document-matcher';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PanFormatDirective } from '../../../utils/form-format.directives';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit, inject } from '@angular/core';

import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-iec-form',
  standalone: true,
  imports: [CommonModule, FormsModule, PanFormatDirective],
  templateUrl: './iec-form.html',
  styleUrl: '../forms-shared.css',
})
export class IecForm implements OnInit {
  currentUser: any = null;
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  documentViewerUrl: string | null = null;
  safeDocumentViewerUrl: SafeResourceUrl | null = null;
  sanitizer = inject(DomSanitizer);
  
  viewDocument(url: string) {
    this.documentViewerUrl = this.api.getFileUrl(url);
    this.safeDocumentViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.documentViewerUrl);
  }
  
  closeDocumentViewer() {
    this.documentViewerUrl = null;
  }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // 1. Applicant Details
  applicantFirstName = '';
  applicantLastName = '';
  applicantEmail = '';
  applicantMobile = '';
  applicantAddress = '';

  // 2. Applicant Documents
  applicantPanFile?: File;
  applicantAddressProofFile?: File;

  // 3. Company Details
  companyName = '';
  companyPanNumber = '';
  nameOnCompanyPan = '';
  dateOfIncorporation = '';
  gstin = '';
  companyMobileNumber = '';
  companyMailId = '';

  // 4. Director Details
  hasDirectorDetails = false;
  directorDin = '';
  directorPanName = '';
  directorPanNumber = '';
  directorPanDob = '';
  directorFatherName = '';
  directorAddress = '';
  directorPhoneNumber = '';

  // 5. Director Documents
  directorPanFile?: File;
  directorAddressProofFile?: File;

  // 6. Bank Details
  bankAccountNumber = '';
  bankAccountHolderName = '';
  ifscCode = '';
  bankName = '';

  // 7. Bank Documents
  bankAccountFirstPageFile?: File;
  
  declaration = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api,
    private draftService: DraftService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
    });
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUser = user;
        if (user.owner_name) {
          const names = user.owner_name.split(' ');
          this.applicantFirstName = names[0] || '';
          this.applicantLastName = names.slice(1).join(' ') || '';
        }
        if (user.email) {
          this.applicantEmail = user.email;
          this.companyMailId = user.email;
        }
        if (user.phone) {
          this.applicantMobile = user.phone;
          this.companyMobileNumber = user.phone;
        }
        if (user.company_name) this.companyName = user.company_name;
        if (user.address) this.applicantAddress = user.address;
      } catch (e) {}
    }
  }

  onFileChange(event: any, field: string) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        event.target.value = ''; // Reset input
        return;
      }
      if (field === 'applicantPan') this.applicantPanFile = file;
      if (field === 'applicantAddressProof') this.applicantAddressProofFile = file;
      if (field === 'directorPan') this.directorPanFile = file;
      if (field === 'directorAddressProof') this.directorAddressProofFile = file;
      if (field === 'bankAccountFirstPage') this.bankAccountFirstPageFile = file;
    }
  }

  goBack() {
    this.location.back();
  }

  submitForm() {
    if (!this.declaration) {
      alert('Please check the declaration box.');
      return;
    }
    
    // 1 Validation
    if (!this.applicantFirstName || !this.applicantLastName || !this.applicantEmail || !this.applicantMobile || !this.applicantAddress) {
      alert('Please fill all required Applicant fields.');
      return;
    }

    // 3 Validation
    if (!this.companyName || !this.companyPanNumber || !this.nameOnCompanyPan || !this.dateOfIncorporation || !this.gstin || !this.companyMobileNumber || !this.companyMailId) {
      alert('Please fill all required Company fields.');
      return;
    }

    // 4 Validation
    if (this.hasDirectorDetails) {
      if (!this.directorDin || !this.directorPanName || !this.directorPanNumber || !this.directorPanDob || !this.directorFatherName || !this.directorAddress || !this.directorPhoneNumber) {
        alert('Please fill all required Director fields.');
        return;
      }
    }

    // 6 Validation
    if (!this.bankAccountNumber || !this.bankAccountHolderName || !this.ifscCode || !this.bankName) {
      alert('Please fill all required Bank Details fields.');
      return;
    }
    
    // Documents Validation
    if (!this.applicantPanFile || !this.applicantAddressProofFile) {
      alert('Please upload all mandatory Applicant documents.');
      return;
    }
    
    if (this.hasDirectorDetails && (!this.directorPanFile || !this.directorAddressProofFile)) {
      alert('Please upload all mandatory Director documents.');
      return;
    }

    if (!this.bankAccountFirstPageFile) {
      alert('Please upload all mandatory Bank documents.');
      return;
    }

    this.isSubmitting.set(true);
    const formData = new FormData();
    
    // 1. Applicant Details
    formData.append('applicantFirstName', this.applicantFirstName);
    formData.append('applicantLastName', this.applicantLastName);
    formData.append('applicantEmail', this.applicantEmail);
    formData.append('applicantMobile', this.applicantMobile);
    formData.append('applicantAddress', this.applicantAddress);
    if (this.applicantPanFile) formData.append('applicantPanDoc', this.applicantPanFile as Blob);
    if (this.applicantAddressProofFile) formData.append('applicantAddressProofDoc', this.applicantAddressProofFile as Blob);
    
    // 3. Company Details
    formData.append('companyName', this.companyName);
    formData.append('companyPanNumber', this.companyPanNumber);
    formData.append('nameOnCompanyPan', this.nameOnCompanyPan);
    formData.append('dateOfIncorporation', this.dateOfIncorporation);
    formData.append('gstin', this.gstin);
    formData.append('companyMobileNumber', this.companyMobileNumber);
    formData.append('companyMailId', this.companyMailId);

    // 4. Director Details
    formData.append('hasDirectorDetails', String(this.hasDirectorDetails));
    if (this.hasDirectorDetails) {
      formData.append('directorDin', this.directorDin);
      formData.append('directorPanName', this.directorPanName);
      formData.append('directorPanNumber', this.directorPanNumber);
      formData.append('directorPanDob', this.directorPanDob);
      formData.append('directorFatherName', this.directorFatherName);
      formData.append('directorAddress', this.directorAddress);
      formData.append('directorPhoneNumber', this.directorPhoneNumber);
      if (this.directorPanFile) formData.append('directorPanDoc', this.directorPanFile as Blob);
      if (this.directorAddressProofFile) formData.append('directorAddressProofDoc', this.directorAddressProofFile as Blob);
    }
    
    // 6. Bank Details
    formData.append('bankAccountNumber', this.bankAccountNumber);
    formData.append('bankAccountHolderName', this.bankAccountHolderName);
    formData.append('ifscCode', this.ifscCode);
    formData.append('bankName', this.bankName);
    if (this.bankAccountFirstPageFile) formData.append('bankAccountFirstPage', this.bankAccountFirstPageFile as Blob);

    this.api.post<any>(`orders/${this.orderId()}/submit-iec-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        alert('IEC form submitted successfully!');
        this.router.navigate(['/client-dashboard']);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        console.error('Submission error:', err);
        alert('Error submitting form: ' + (err.error?.message || err.message));
      }
    });
  }
}
