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
  selector: 'app-lei-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent, PanFormatDirective, AadhaarFormatDirective, PhoneFormatDirective],
  templateUrl: './lei-form.html',
  styleUrl: '../forms-shared.css',
})
export class LeiForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

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
    if (this.msmeCertFile) if (this.msmeCertFile) formData.append('msmeCertificate', this.msmeCertFile); else if (this.existingDocs['msmeCertificate']) formData.append('msmeCertificate_existing', this.existingDocs['msmeCertificate'].fileUrl);
    if (this.addressProofFile) if (this.addressProofFile) formData.append('addressProof', this.addressProofFile); else if (this.existingDocs['addressProof']) formData.append('addressProof_existing', this.existingDocs['addressProof'].fileUrl);
    if (this.incorpCertFile) if (this.incorpCertFile) formData.append('incorpCert', this.incorpCertFile); else if (this.existingDocs['incorpCert']) formData.append('incorpCert_existing', this.existingDocs['incorpCert'].fileUrl);
    if (this.panCardFile) if (this.panCardFile) formData.append('panCard', this.panCardFile); else if (this.existingDocs['panCard']) formData.append('panCard_existing', this.existingDocs['panCard'].fileUrl);
    if (this.gstCertFile) if (this.gstCertFile) formData.append('gstCert', this.gstCertFile); else if (this.existingDocs['gstCert']) formData.append('gstCert_existing', this.existingDocs['gstCert'].fileUrl);
    if (this.auditedFinancialsFile) if (this.auditedFinancialsFile) formData.append('auditedFinancials', this.auditedFinancialsFile); else if (this.existingDocs['auditedFinancials']) formData.append('auditedFinancials_existing', this.existingDocs['auditedFinancials'].fileUrl);
    if (this.moaAoaFile) if (this.moaAoaFile) formData.append('moaAoa', this.moaAoaFile); else if (this.existingDocs['moaAoa']) formData.append('moaAoa_existing', this.existingDocs['moaAoa'].fileUrl);
    if (this.boardResolutionFile) if (this.boardResolutionFile) formData.append('boardResolution', this.boardResolutionFile); else if (this.existingDocs['boardResolution']) formData.append('boardResolution_existing', this.existingDocs['boardResolution'].fileUrl);

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
