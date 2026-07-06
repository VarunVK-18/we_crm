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
  selector: 'app-trademark-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent, PanFormatDirective, AadhaarFormatDirective, PhoneFormatDirective],
  templateUrl: './trademark-form.html',
  styleUrl: '../forms-shared.css',
})
export class TrademarkForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

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

    if (fieldName === 'udyamCert') this.udyamCertFile = file;
    else if (fieldName === 'trademarkLogo') this.trademarkLogoFile = file;
    else if (fieldName === 'signature') this.signatureFile = file;
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
