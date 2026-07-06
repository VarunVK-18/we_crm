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
  selector: 'app-dsc-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent, PanFormatDirective, AadhaarFormatDirective, PhoneFormatDirective],
  templateUrl: './dsc-form.html',
  styleUrl: '../forms-shared.css',
})
export class DscForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  applyingFor = 'Individual DSC for Company Incorporation / Registration';
  applicantName = '';
  applicantMail = '';
  applicantPhone = '';
  organizationName = '';
  organizationType = '';
  officeAddress = '';
  courierAddress = '';

  applicantPanFile?: File;
  applicantAadhaarFile?: File;
  applicantPhotoFile?: File;
  coiFile?: File;
  organizationPanFile?: File;
  gstFile?: File;
  msmeFile?: File;
  otherDirectorPanFile?: File;

  isVerified = false;

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
        if (draft.applyingFor !== undefined) this.applyingFor = draft.applyingFor;
        if (draft.applicantName !== undefined) this.applicantName = draft.applicantName;
        if (draft.applicantMail !== undefined) this.applicantMail = draft.applicantMail;
        if (draft.applicantPhone !== undefined) this.applicantPhone = draft.applicantPhone;
        if (draft.organizationName !== undefined) this.organizationName = draft.organizationName;
        if (draft.organizationType !== undefined) this.organizationType = draft.organizationType;
        if (draft.officeAddress !== undefined) this.officeAddress = draft.officeAddress;
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

    if (fieldName === 'applicantPan') this.applicantPanFile = file;
    else if (fieldName === 'applicantAadhaar') this.applicantAadhaarFile = file;
    else if (fieldName === 'applicantPhoto') this.applicantPhotoFile = file;
    else if (fieldName === 'certificateOfIncorporation') this.coiFile = file;
    else if (fieldName === 'organizationPan') this.organizationPanFile = file;
    else if (fieldName === 'gstCertificate') this.gstFile = file;
    else if (fieldName === 'msmeCertificate') this.msmeFile = file;
    else if (fieldName === 'otherDirectorPan') this.otherDirectorPanFile = file;
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
      applyingFor: this.applyingFor,
      applicantName: this.applicantName,
      applicantMail: this.applicantMail,
      applicantPhone: this.applicantPhone,
      organizationName: this.organizationName,
      organizationType: this.organizationType,
      officeAddress: this.officeAddress,
      courierAddress: this.courierAddress,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.applicantName || !this.applicantMail || !this.applicantPhone || !this.organizationName || !this.organizationType || !this.officeAddress || !this.courierAddress) {
      this.errorMessage.set('Please fill all required text fields.');
      return;
    }

    if (!this.applicantPanFile) {
      this.errorMessage.set('Please upload Applicant PAN Card.');
      return;
    }
    if (!this.applicantAadhaarFile) {
      this.errorMessage.set('Please upload Applicant Aadhaar Card.');
      return;
    }
    if (!this.applicantPhotoFile) {
      this.errorMessage.set('Please upload Applicant Photo.');
      return;
    }

    if (!this.isVerified) {
      this.errorMessage.set('Please check the verification checkbox.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('applyingFor', this.applyingFor);
    formData.append('applicantName', this.applicantName);
    formData.append('applicantMail', this.applicantMail);
    formData.append('applicantPhone', this.applicantPhone);
    formData.append('organizationName', this.organizationName);
    formData.append('organizationType', this.organizationType);
    formData.append('officeAddress', this.officeAddress);
    formData.append('courierAddress', this.courierAddress);

    formData.append('applicantPan', this.applicantPanFile as File);
    formData.append('applicantAadhaar', this.applicantAadhaarFile as File);
    formData.append('applicantPhoto', this.applicantPhotoFile as File);

    if (this.coiFile) formData.append('certificateOfIncorporation', this.coiFile as File);
    if (this.organizationPanFile) formData.append('organizationPan', this.organizationPanFile as File);
    if (this.gstFile) formData.append('gstCertificate', this.gstFile as File);
    if (this.msmeFile) formData.append('msmeCertificate', this.msmeFile as File);
    if (this.otherDirectorPanFile) formData.append('otherDirectorPan', this.otherDirectorPanFile as File);

    this.api.post(`orders/${this.orderId()}/submit-dsc-form`, formData).subscribe({
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
