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
  selector: 'app-msme-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent, PanFormatDirective, AadhaarFormatDirective, PhoneFormatDirective],
  templateUrl: './msme-form.html',
  styleUrl: '../forms-shared.css',
})
export class MsmeForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Enterprise details
  enterpriseName = '';
  orgType = 'Proprietorship';
  majorActivity = 'Service';
  address = '';
  unitName = '';
  mobile = '';
  email = '';
  maleEmployees = '';
  femaleEmployees = '';
  incDate = '';
  commenceDate = '';
  prevMsme = '';
  gst = '';
  investment = '';
  turnover = '';
  companyPanFile?: File;

  // Business owner details
  ownerName = '';
  gender = 'Male';
  whatsapp = '';
  personalEmail = '';
  physicallyHandicapped = 'No';
  socialCategory = 'General';
  ownerAadhaarFile?: File;
  ownerPassbookFile?: File;

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
        if (draft.enterpriseName !== undefined) this.enterpriseName = draft.enterpriseName;
        if (draft.orgType !== undefined) this.orgType = draft.orgType;
        if (draft.majorActivity !== undefined) this.majorActivity = draft.majorActivity;
        if (draft.address !== undefined) this.address = draft.address;
        if (draft.unitName !== undefined) this.unitName = draft.unitName;
        if (draft.mobile !== undefined) this.mobile = draft.mobile;
        if (draft.email !== undefined) this.email = draft.email;
        if (draft.maleEmployees !== undefined) this.maleEmployees = draft.maleEmployees;
        if (draft.femaleEmployees !== undefined) this.femaleEmployees = draft.femaleEmployees;
        if (draft.incDate !== undefined) this.incDate = draft.incDate;
        if (draft.commenceDate !== undefined) this.commenceDate = draft.commenceDate;
        if (draft.prevMsme !== undefined) this.prevMsme = draft.prevMsme;
        if (draft.gst !== undefined) this.gst = draft.gst;
        if (draft.investment !== undefined) this.investment = draft.investment;
        if (draft.turnover !== undefined) this.turnover = draft.turnover;
        if (draft.ownerName !== undefined) this.ownerName = draft.ownerName;
        if (draft.gender !== undefined) this.gender = draft.gender;
        if (draft.whatsapp !== undefined) this.whatsapp = draft.whatsapp;
        if (draft.personalEmail !== undefined) this.personalEmail = draft.personalEmail;
        if (draft.physicallyHandicapped !== undefined) this.physicallyHandicapped = draft.physicallyHandicapped;
        if (draft.socialCategory !== undefined) this.socialCategory = draft.socialCategory;
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

    if (fieldName === 'companyPan') {
      this.companyPanFile = file;
    } else if (fieldName === 'ownerAadhaar') {
      this.ownerAadhaarFile = file;
    } else if (fieldName === 'ownerPassbook') {
      this.ownerPassbookFile = file;
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
      enterpriseName: this.enterpriseName,
      orgType: this.orgType,
      majorActivity: this.majorActivity,
      address: this.address,
      unitName: this.unitName,
      mobile: this.mobile,
      email: this.email,
      maleEmployees: this.maleEmployees,
      femaleEmployees: this.femaleEmployees,
      incDate: this.incDate,
      commenceDate: this.commenceDate,
      prevMsme: this.prevMsme,
      gst: this.gst,
      investment: this.investment,
      turnover: this.turnover,
      ownerName: this.ownerName,
      gender: this.gender,
      whatsapp: this.whatsapp,
      personalEmail: this.personalEmail,
      physicallyHandicapped: this.physicallyHandicapped,
      socialCategory: this.socialCategory,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.enterpriseName || !this.address || !this.mobile || !this.email) {
      this.errorMessage.set('Please fill all required Enterprise fields.');
      return;
    }

    if (!this.ownerName || !this.whatsapp || !this.personalEmail) {
      this.errorMessage.set('Please fill all required Business Owner fields.');
      return;
    }

    if (!this.companyPanFile) {
      this.errorMessage.set("Please upload your Company's PAN Card.");
      return;
    }
    if (!this.ownerAadhaarFile) {
      this.errorMessage.set("Please upload your Aadhaar Card.");
      return;
    }
    if (!this.ownerPassbookFile) {
      this.errorMessage.set("Please upload your Bank Passbook.");
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('enterpriseName', this.enterpriseName);
    formData.append('orgType', this.orgType);
    formData.append('majorActivity', this.majorActivity);
    formData.append('address', this.address);
    formData.append('unitName', this.unitName);
    formData.append('mobile', this.mobile);
    formData.append('email', this.email);
    formData.append('maleEmployees', this.maleEmployees);
    formData.append('femaleEmployees', this.femaleEmployees);
    formData.append('incDate', this.incDate);
    formData.append('commenceDate', this.commenceDate);
    formData.append('prevMsme', this.prevMsme);
    formData.append('gst', this.gst);
    formData.append('investment', this.investment);
    formData.append('turnover', this.turnover);

    formData.append('ownerName', this.ownerName);
    formData.append('gender', this.gender);
    formData.append('whatsapp', this.whatsapp);
    formData.append('personalEmail', this.personalEmail);
    formData.append('physicallyHandicapped', this.physicallyHandicapped);
    formData.append('socialCategory', this.socialCategory);

    formData.append('companyPan', this.companyPanFile as File);
    formData.append('ownerAadhaar', this.ownerAadhaarFile as File);
    formData.append('ownerPassbook', this.ownerPassbookFile as File);

    this.api.post(`orders/${this.orderId()}/submit-msme-form`, formData).subscribe({
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
