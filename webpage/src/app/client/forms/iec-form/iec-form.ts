import { PanFormatDirective, AadhaarFormatDirective, PhoneFormatDirective } from '../../../utils/form-format.directives';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-iec-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent, PanFormatDirective, AadhaarFormatDirective, PhoneFormatDirective],
  templateUrl: './iec-form.html',
  styleUrl: '../forms-shared.css',
})
export class IecForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Step 1: Business Details
  businessName = '';
  entityType = '';
  panNumber = '';
  mobileNumber = '';
  emailId = '';
  businessAddress = '';

  // Step 2: Bank Details
  bankName = '';
  accountNumber = '';
  ifscCode = '';

  // Step 3: Document Uploads
  panCardFile?: File;
  addressProofFile?: File;
  cancelledChequeFile?: File;
  incorpCertFile?: File;

  constructor(private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api
  ,
    private draftService: DraftService,
    private confirmDialog: ConfirmDialogService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
    });
          // Auto-fill from user profile
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        
        if (user.owner_name) {
          if ('fullName' in this) (this as any).fullName = user.owner_name;
          else if ('applicantName' in this) (this as any).applicantName = user.owner_name;
          else if ('proprietorName' in this) (this as any).proprietorName = user.owner_name;
          else if ('directorName' in this) (this as any).directorName = user.owner_name;
        }

        if (user.email) {
          if ('emailId' in this) (this as any).emailId = user.email;
          else if ('email' in this) (this as any).email = user.email;
        }

        if (user.phone) {
          if ('mobileNumber' in this) (this as any).mobileNumber = user.phone;
          else if ('mobile' in this) (this as any).mobile = user.phone;
          else if ('contactNumber' in this) (this as any).contactNumber = user.phone;
        }

        if (user.company_name) {
          if ('businessName' in this) (this as any).businessName = user.company_name;
          else if ('companyName' in this) (this as any).companyName = user.company_name;
          else if ('entityName' in this) (this as any).entityName = user.company_name;
        }

        if (user.business_type) {
          if ('businessType' in this) (this as any).businessType = user.business_type;
          else if ('entityType' in this) (this as any).entityType = user.business_type;
        }

        if (user.pan) {
          if ('panNumber' in this) (this as any).panNumber = user.pan;
          else if ('pan' in this) (this as any).pan = user.pan;
        }
        if (user.onboarding_documents) {
          const docs = user.onboarding_documents;
          const keywordMap: any = {
            'panCard': ['pan'],
            'panFile': ['pan'],
            'addressProof': ['address proof', 'aadhaar', 'passport', 'voter'],
            'addressProofFile': ['address proof', 'aadhaar', 'passport', 'voter'],
            'businessAddressProof': ['business address', 'rent agreement', 'eb bill', 'property tax'],
            'incorpCert': ['incorporation', 'incorp'],
            'photoFile': ['photo', 'passport size'],
            'passportPhoto': ['photo', 'passport size'],
            'aadhaarFile': ['aadhaar'],
            'identityProof': ['identity', 'id proof'],
            'cancelledCheque': ['cheque', 'bank'],
            'authSignatoryProof': ['authorization', 'signatory'],
            'signatureFile': ['signature'],
            'trademarkLogo': ['logo', 'brand'],
            'msmeCert': ['msme', 'udyam'],
            'gstCert': ['gst']
          };
          
          for (const field of Object.keys(keywordMap)) {
            const keywords = keywordMap[field];
            const matchedDoc = docs.find((d: any) => d.name && keywords.some((k: string) => d.name.toLowerCase().includes(k)));
            if (matchedDoc) {
              this.existingDocs[field] = matchedDoc;
            }
          }
        }

      } catch(e) {}
    }

    const draft = this.draftService.loadDraft(this.orderId(), this.constructor.name);
      if (draft) {
        if (draft.businessName !== undefined) this.businessName = draft.businessName;
        if (draft.entityType !== undefined) this.entityType = draft.entityType;
        if (draft.panNumber !== undefined) this.panNumber = draft.panNumber;
        if (draft.mobileNumber !== undefined) this.mobileNumber = draft.mobileNumber;
        if (draft.emailId !== undefined) this.emailId = draft.emailId;
        if (draft.businessAddress !== undefined) this.businessAddress = draft.businessAddress;
        if (draft.bankName !== undefined) this.bankName = draft.bankName;
        if (draft.accountNumber !== undefined) this.accountNumber = draft.accountNumber;
        if (draft.ifscCode !== undefined) this.ifscCode = draft.ifscCode;
      }
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.confirmDialog.confirm({
        title: 'File Too Large',
        message: 'Please upload a file that is 2 MB or smaller.',
        confirmText: 'Okay',
        hideCancel: true,
        isDestructive: true
      });
      event.target.value = '';
      return;
    }

    if (fieldName === 'panCard') this.panCardFile = file;
    else if (fieldName === 'addressProof') this.addressProofFile = file;
    else if (fieldName === 'cancelledCheque') this.cancelledChequeFile = file;
    else if (fieldName === 'incorpCert') this.incorpCertFile = file;
  }

  async goBack() {
    const shouldDraft = await this.confirmDialog.confirm({
      title: 'Save Draft?',
      message: 'Do you want to save this form as a draft before leaving?',
      confirmText: 'Save Draft',
      cancelText: 'Leave without saving'
    });
    if (shouldDraft === null) {
      return;
    }
    if (shouldDraft) {
      this.saveDraft();
    }
    this.location.back();
  }

  
  saveDraft() {
    const draftData = {
      businessName: this.businessName,
      entityType: this.entityType,
      panNumber: this.panNumber,
      mobileNumber: this.mobileNumber,
      emailId: this.emailId,
      businessAddress: this.businessAddress,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      ifscCode: this.ifscCode,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.businessName || !this.entityType || !this.panNumber || !this.mobileNumber || !this.emailId || !this.businessAddress ||
        !this.bankName || !this.accountNumber || !this.ifscCode) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if ((!this.panCardFile && !this.existingDocs['panCard']) || (!this.addressProofFile && !this.existingDocs['addressProof']) || (!this.cancelledChequeFile && !this.existingDocs['cancelledCheque'])) {
      this.errorMessage.set('Please upload all required documents (PAN, Address Proof, Cancelled Cheque).');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    // Step 1
    formData.append('businessName', this.businessName);
    formData.append('entityType', this.entityType);
    formData.append('panNumber', this.panNumber);
    formData.append('mobileNumber', this.mobileNumber);
    formData.append('emailId', this.emailId);
    formData.append('businessAddress', this.businessAddress);
    
    // Step 2
    formData.append('bankName', this.bankName);
    formData.append('accountNumber', this.accountNumber);
    formData.append('ifscCode', this.ifscCode);

    // Files
    if (this.panCardFile) formData.append('panCard', this.panCardFile); else if (this.existingDocs['panCard']) formData.append('panCard_existing', this.existingDocs['panCard'].fileUrl);
    if (this.addressProofFile) formData.append('addressProof', this.addressProofFile); else if (this.existingDocs['addressProof']) formData.append('addressProof_existing', this.existingDocs['addressProof'].fileUrl);
    if (this.cancelledChequeFile) formData.append('cancelledCheque', this.cancelledChequeFile); else if (this.existingDocs['cancelledCheque']) formData.append('cancelledCheque_existing', this.existingDocs['cancelledCheque'].fileUrl);
    if (this.incorpCertFile) {
      if (this.incorpCertFile) formData.append('incorpCert', this.incorpCertFile); else if (this.existingDocs['incorpCert']) formData.append('incorpCert_existing', this.existingDocs['incorpCert'].fileUrl);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-iec-form`, formData).subscribe({
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
