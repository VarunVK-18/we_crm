import { AutoFillUtils } from '../../../utils/autofill-utils';
import { DocumentMatcher } from '../../../utils/document-matcher';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit, inject } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-gst-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './gst-form.html',
  styleUrl: '../forms-shared.css',
})
export class GstForm implements OnInit {
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
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // 1. Business Information
  legalName = '';
  panOfBusiness = '';
  businessEmail = '';
  businessPhone = '';
  tradeName = '';
  incorpDate = '';
  incorpCert?: File;

  // 2. Director 1 Personal Information
  dir1FullName = '';
  dir1FatherName = '';
  dir1Dob = '';
  dir1Phone = '';
  dir1Mail = '';
  dir1Gender = 'Male';
  dir1Din = '';
  dir1Pan = '';
  dir1Address = '';
  dir1AuthSignatory = 'No';

  // 3. Director 1 Documents
  dir1Photo?: File;
  dir1AuthSignatoryDoc?: File; // conditional

  // 5. Director 2 Personal Information
  hasDirector2 = 'No';
  dir2FullName = '';
  dir2FatherName = '';
  dir2Dob = '';
  dir2Phone = '';
  dir2Mail = '';
  dir2Gender = 'Male';
  dir2Din = '';
  dir2Pan = '';
  dir2Address = '';
  dir2AuthSignatory = 'No';

  // 6. Director 2 Documents
  dir2Photo?: File;
  dir2AuthSignatoryDoc?: File; // conditional

  // 7. Business Details
  businessAddress = '';
  premisesType = 'Own';
  businessDescription = '';

  // 8. Business Property Documents
  ebBill?: File;
  rentalAgreement?: File; // conditional
  propertyTaxReceipt?: File; // conditional

  // 9. Additional Business Places
  hasAdditionalPlaces = 'No';
  secondPlaceAddress = '';
  thirdPlaceAddress = '';

  // 10. Company Document
  companyPanFile?: File;

  // 11. Bank Details
  accountNumber = '';
  accountType = 'Current';
  ifscCode = '';

  accountTypeOptions = ['Current', 'Savings', 'Cash Credit', 'Overdraft'];

  // 12. Bank Documents
  bankDocument?: File;

  // 13. Declaration
  isDeclared = false;

  constructor(private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api,
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
        this.currentUser = user;
        
        if (user.owner_name) {
          this.dir1FullName = user.owner_name;
        }
        if (user.email) {
          this.businessEmail = user.email;
          this.dir1Mail = user.email;
        }
        if (user.phone) {
          this.businessPhone = user.phone;
          this.dir1Phone = user.phone;
        }
        if (user.company_name) {
          this.legalName = user.company_name;
        }
        if (user.pan) {
          this.panOfBusiness = user.pan;
          this.dir1Pan = user.pan;
        }
        
        if (user.onboarding_documents) {
          const docs = user.onboarding_documents;
          const keywordMap: any = {
            'incorpCert': ['incorporation', 'incorp'],
            'companyPanFile': ['company pan', 'pan card', 'pan'],
            'dir1Photo': ['photo', 'passport size'],
            'ebBill': ['eb bill', 'electricity'],
            'rentalAgreement': ['rent agreement', 'rental'],
            'propertyTaxReceipt': ['property tax', 'house tax'],
            'bankDocument': ['bank statement', 'cancelled cheque', 'passbook'],
            'dir1AuthSignatoryDoc': ['authorization', 'signatory']
          };
          
          for (const field of Object.keys(keywordMap)) {
            const keywords = keywordMap[field];
            const eName = this.legalName || '';
            const matchedDoc = DocumentMatcher.findExistingDoc(eName, docs, keywords);
            if (matchedDoc) {
              this.existingDocs[field] = matchedDoc;
            }
          }
        }
      } catch(e) {}
    }

    const draft = this.draftService.loadDraft(this.orderId(), this.constructor.name);
    if (draft) {
      Object.assign(this, draft);
    }
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = (fieldName.includes('Photo')) ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
    const sizeError = (fieldName.includes('Photo')) ? '1 MB' : '2 MB';

    if (file.size > maxSize) {
      this.confirmDialog.confirm({
        title: 'File Too Large',
        message: 'Please upload a file that is ' + sizeError + ' or smaller.',
        confirmText: 'Okay',
        hideCancel: true,
        isDestructive: true
      });
      event.target.value = '';
      return;
    }

    (this as any)[fieldName] = file;
  }

  async goBack() {
    const shouldDraft = await this.confirmDialog.confirm({
      title: 'Save Draft?',
      message: 'Do you want to save this form as a draft before leaving?',
      confirmText: 'Save Draft',
      cancelText: 'Leave without saving'
    });
    if (shouldDraft === null) return;
    if (shouldDraft) this.saveDraft();
    this.location.back();
  }

  saveDraft() {
    const draftData = {
      legalName: this.legalName,
      panOfBusiness: this.panOfBusiness,
      businessEmail: this.businessEmail,
      businessPhone: this.businessPhone,
      tradeName: this.tradeName,
      incorpDate: this.incorpDate,
      dir1FullName: this.dir1FullName,
      dir1FatherName: this.dir1FatherName,
      dir1Dob: this.dir1Dob,
      dir1Phone: this.dir1Phone,
      dir1Mail: this.dir1Mail,
      dir1Gender: this.dir1Gender,
      dir1Din: this.dir1Din,
      dir1Pan: this.dir1Pan,
      dir1Address: this.dir1Address,
      dir1AuthSignatory: this.dir1AuthSignatory,
      hasDirector2: this.hasDirector2,
      dir2FullName: this.dir2FullName,
      dir2FatherName: this.dir2FatherName,
      dir2Dob: this.dir2Dob,
      dir2Phone: this.dir2Phone,
      dir2Mail: this.dir2Mail,
      dir2Gender: this.dir2Gender,
      dir2Din: this.dir2Din,
      dir2Pan: this.dir2Pan,
      dir2Address: this.dir2Address,
      dir2AuthSignatory: this.dir2AuthSignatory,
      businessAddress: this.businessAddress,
      premisesType: this.premisesType,
      businessDescription: this.businessDescription,
      hasAdditionalPlaces: this.hasAdditionalPlaces,
      secondPlaceAddress: this.secondPlaceAddress,
      thirdPlaceAddress: this.thirdPlaceAddress,
      accountNumber: this.accountNumber,
      accountType: this.accountType,
      ifscCode: this.ifscCode
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    // Basic validation
    if (!this.legalName || !this.panOfBusiness || !this.businessEmail || !this.businessPhone || !this.incorpDate ||
        !this.dir1FullName || !this.dir1FatherName || !this.dir1Dob || !this.dir1Phone || !this.dir1Mail || !this.dir1Din || !this.dir1Pan || !this.dir1Address ||
        !this.businessAddress || !this.businessDescription || !this.accountNumber || !this.ifscCode) {
      this.errorMessage.set('Please fill all required text fields.');
      return;
    }

    if (this.hasDirector2 === 'Yes') {
      if (!this.dir2FullName || !this.dir2FatherName || !this.dir2Dob || !this.dir2Phone || !this.dir2Mail || !this.dir2Din || !this.dir2Pan || !this.dir2Address) {
        this.errorMessage.set('Please fill all required text fields for Director 2.');
        return;
      }
    }

    if (this.hasAdditionalPlaces === 'Yes' && !this.secondPlaceAddress) {
      this.errorMessage.set('Please fill Second Place of Business Address.');
      return;
    }

    if (!this.incorpCert && !this.existingDocs['incorpCert']) { this.errorMessage.set('Please upload Incorporation Certificate.'); return; }
    if (!this.companyPanFile && !this.existingDocs['companyPanFile']) { this.errorMessage.set('Please upload Company PAN.'); return; }
    if (!this.dir1Photo && !this.existingDocs['dir1Photo']) { this.errorMessage.set('Please upload Director 1 Photo.'); return; }
    if (this.dir1AuthSignatory === 'Yes' && !this.dir1AuthSignatoryDoc && !this.existingDocs['dir1AuthSignatoryDoc']) { this.errorMessage.set('Please upload Director 1 Authorized Signatory Proof.'); return; }
    
    if (this.hasDirector2 === 'Yes') {
      if (!this.dir2Photo && !this.existingDocs['dir2Photo']) { this.errorMessage.set('Please upload Director 2 Photo.'); return; }
      if (this.dir2AuthSignatory === 'Yes' && !this.dir2AuthSignatoryDoc && !this.existingDocs['dir2AuthSignatoryDoc']) { this.errorMessage.set('Please upload Director 2 Authorized Signatory Proof.'); return; }
    }

    if (this.premisesType === 'Rent' && !this.rentalAgreement && !this.existingDocs['rentalAgreement']) { this.errorMessage.set('Please upload Rental Agreement.'); return; }
    if (this.premisesType === 'Own' && !this.propertyTaxReceipt && !this.existingDocs['propertyTaxReceipt']) { this.errorMessage.set('Please upload Property Tax Receipt.'); return; }
    if (!this.bankDocument && !this.existingDocs['bankDocument']) { this.errorMessage.set('Please upload Bank Document.'); return; }

    if (!this.isDeclared) {
      this.errorMessage.set('Please check the declaration checkbox.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('legalName', this.legalName);
    formData.append('panOfBusiness', this.panOfBusiness);
    formData.append('businessEmail', this.businessEmail);
    formData.append('businessPhone', this.businessPhone);
    formData.append('tradeName', this.tradeName);
    formData.append('incorpDate', this.incorpDate);
    formData.append('dir1FullName', this.dir1FullName);
    formData.append('dir1FatherName', this.dir1FatherName);
    formData.append('dir1Dob', this.dir1Dob);
    formData.append('dir1Phone', this.dir1Phone);
    formData.append('dir1Mail', this.dir1Mail);
    formData.append('dir1Gender', this.dir1Gender);
    formData.append('dir1Din', this.dir1Din);
    formData.append('dir1Pan', this.dir1Pan);
    formData.append('dir1Address', this.dir1Address);
    formData.append('dir1AuthSignatory', this.dir1AuthSignatory);

    formData.append('hasDirector2', this.hasDirector2);
    if (this.hasDirector2 === 'Yes') {
      formData.append('dir2FullName', this.dir2FullName);
      formData.append('dir2FatherName', this.dir2FatherName);
      formData.append('dir2Dob', this.dir2Dob);
      formData.append('dir2Phone', this.dir2Phone);
      formData.append('dir2Mail', this.dir2Mail);
      formData.append('dir2Gender', this.dir2Gender);
      formData.append('dir2Din', this.dir2Din);
      formData.append('dir2Pan', this.dir2Pan);
      formData.append('dir2Address', this.dir2Address);
      formData.append('dir2AuthSignatory', this.dir2AuthSignatory);
    }

    formData.append('businessAddress', this.businessAddress);
    formData.append('premisesType', this.premisesType);
    formData.append('businessDescription', this.businessDescription);

    formData.append('hasAdditionalPlaces', this.hasAdditionalPlaces);
    if (this.hasAdditionalPlaces === 'Yes') {
      formData.append('secondPlaceAddress', this.secondPlaceAddress);
      formData.append('thirdPlaceAddress', this.thirdPlaceAddress);
    }

    formData.append('accountNumber', this.accountNumber);
    formData.append('accountType', this.accountType);
    formData.append('ifscCode', this.ifscCode);

    const appendDoc = (fileVar: any, existingKey: string, formKey: string, isImage = false) => {
      if (fileVar) {
        formData.append(formKey, fileVar as File);
      } else if (this.existingDocs[existingKey]) {
        formData.append(formKey + '_existing', this.existingDocs[existingKey].fileUrl);
      }
    };

    appendDoc(this.incorpCert, 'incorpCert', 'incorpCert');
    appendDoc(this.companyPanFile, 'companyPanFile', 'companyPanFile');
    appendDoc(this.dir1Photo, 'dir1Photo', 'dir1Photo', true);
    if (this.dir1AuthSignatory === 'Yes') appendDoc(this.dir1AuthSignatoryDoc, 'dir1AuthSignatoryDoc', 'dir1AuthSignatoryDoc');
    
    if (this.hasDirector2 === 'Yes') {
      appendDoc(this.dir2Photo, 'dir2Photo', 'dir2Photo', true);
      if (this.dir2AuthSignatory === 'Yes') appendDoc(this.dir2AuthSignatoryDoc, 'dir2AuthSignatoryDoc', 'dir2AuthSignatoryDoc');
    }

    appendDoc(this.ebBill, 'ebBill', 'ebBill');
    if (this.premisesType === 'Rent') appendDoc(this.rentalAgreement, 'rentalAgreement', 'rentalAgreement');
    if (this.premisesType === 'Own') appendDoc(this.propertyTaxReceipt, 'propertyTaxReceipt', 'propertyTaxReceipt');
    appendDoc(this.bankDocument, 'bankDocument', 'bankDocument');

    this.api.post(`orders/${this.orderId()}/submit-gst-form`, formData).subscribe({
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

  onEntityNameChange(newName: string) {
    if (this.currentUser) AutoFillUtils.autoFillTextData(this, newName, this.currentUser);
  }
}
