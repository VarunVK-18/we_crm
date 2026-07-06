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
  selector: 'app-proprietorship-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent, PanFormatDirective, AadhaarFormatDirective, PhoneFormatDirective],
  templateUrl: './proprietorship-form.html',
  styleUrl: '../forms-shared.css',
})
export class ProprietorshipForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Step 1: Client Details
  proprietorName = '';
  panNumber = '';
  aadhaarNumber = '';
  mobileNumber = '';
  emailId = '';
  dob = '';

  // Step 2: Business Details
  businessName = '';
  businessActivity = '';
  businessAddress = '';
  state = '';
  pinCode = '';

  // Step 3: Document Uploads
  panCardFile?: File;
  aadhaarCardFile?: File;
  passportPhotoFile?: File;
  addressProofFile?: File;
  businessAddressProofFile?: File;

  // Step 4: Registration Services
  needGst = false;
  needMsme = false;
  needShopAct = false;
  needFssai = false;
  needIec = false;

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
        if (draft.proprietorName !== undefined) this.proprietorName = draft.proprietorName;
        if (draft.panNumber !== undefined) this.panNumber = draft.panNumber;
        if (draft.aadhaarNumber !== undefined) this.aadhaarNumber = draft.aadhaarNumber;
        if (draft.mobileNumber !== undefined) this.mobileNumber = draft.mobileNumber;
        if (draft.emailId !== undefined) this.emailId = draft.emailId;
        if (draft.dob !== undefined) this.dob = draft.dob;
        if (draft.businessName !== undefined) this.businessName = draft.businessName;
        if (draft.businessActivity !== undefined) this.businessActivity = draft.businessActivity;
        if (draft.businessAddress !== undefined) this.businessAddress = draft.businessAddress;
        if (draft.state !== undefined) this.state = draft.state;
        if (draft.pinCode !== undefined) this.pinCode = draft.pinCode;
        if (draft.needGst !== undefined) this.needGst = draft.needGst;
        if (draft.needMsme !== undefined) this.needMsme = draft.needMsme;
        if (draft.needShopAct !== undefined) this.needShopAct = draft.needShopAct;
        if (draft.needFssai !== undefined) this.needFssai = draft.needFssai;
        if (draft.needIec !== undefined) this.needIec = draft.needIec;
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
    else if (fieldName === 'aadhaarCard') this.aadhaarCardFile = file;
    else if (fieldName === 'passportPhoto') this.passportPhotoFile = file;
    else if (fieldName === 'addressProof') this.addressProofFile = file;
    else if (fieldName === 'businessAddressProof') this.businessAddressProofFile = file;
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
      proprietorName: this.proprietorName,
      panNumber: this.panNumber,
      aadhaarNumber: this.aadhaarNumber,
      mobileNumber: this.mobileNumber,
      emailId: this.emailId,
      dob: this.dob,
      businessName: this.businessName,
      businessActivity: this.businessActivity,
      businessAddress: this.businessAddress,
      state: this.state,
      pinCode: this.pinCode,
      needGst: this.needGst,
      needMsme: this.needMsme,
      needShopAct: this.needShopAct,
      needFssai: this.needFssai,
      needIec: this.needIec,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.proprietorName || !this.panNumber || !this.businessName) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if ((!this.panCardFile && !this.existingDocs['panCard']) || (!this.aadhaarCardFile && !this.existingDocs['aadhaarCard']) || (!this.passportPhotoFile && !this.existingDocs['passportPhoto']) || (!this.addressProofFile && !this.existingDocs['addressProof']) || (!this.businessAddressProofFile && !this.existingDocs['businessAddressProof'])) {
      this.errorMessage.set('Please upload all required documents.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    // Step 1
    formData.append('proprietorName', this.proprietorName);
    formData.append('panNumber', this.panNumber);
    formData.append('aadhaarNumber', this.aadhaarNumber);
    formData.append('mobileNumber', this.mobileNumber);
    formData.append('emailId', this.emailId);
    formData.append('dob', this.dob);
    // Step 2
    formData.append('businessName', this.businessName);
    formData.append('businessActivity', this.businessActivity);
    formData.append('businessAddress', this.businessAddress);
    formData.append('state', this.state);
    formData.append('pinCode', this.pinCode);
    // Step 4
    formData.append('needGst', this.needGst ? 'true' : 'false');
    formData.append('needMsme', this.needMsme ? 'true' : 'false');
    formData.append('needShopAct', this.needShopAct ? 'true' : 'false');
    formData.append('needFssai', this.needFssai ? 'true' : 'false');
    formData.append('needIec', this.needIec ? 'true' : 'false');

    // Files
    if (this.panCardFile) formData.append('panCard', this.panCardFile); else if (this.existingDocs['panCard']) formData.append('panCard_existing', this.existingDocs['panCard'].fileUrl);
    if (this.aadhaarCardFile) formData.append('aadhaarCard', this.aadhaarCardFile); else if (this.existingDocs['aadhaarCard']) formData.append('aadhaarCard_existing', this.existingDocs['aadhaarCard'].fileUrl);
    if (this.passportPhotoFile) formData.append('passportPhoto', this.passportPhotoFile); else if (this.existingDocs['passportPhoto']) formData.append('passportPhoto_existing', this.existingDocs['passportPhoto'].fileUrl);
    if (this.addressProofFile) formData.append('addressProof', this.addressProofFile); else if (this.existingDocs['addressProof']) formData.append('addressProof_existing', this.existingDocs['addressProof'].fileUrl);
    if (this.businessAddressProofFile) formData.append('businessAddressProof', this.businessAddressProofFile); else if (this.existingDocs['businessAddressProof']) formData.append('businessAddressProof_existing', this.existingDocs['businessAddressProof'].fileUrl);

    this.api.post<any>(`orders/${this.orderId()}/submit-proprietorship-form`, formData).subscribe({
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
