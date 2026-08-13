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
  selector: 'app-dpiit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './dpiit-form.html',
  styleUrl: '../forms-shared.css',
})
export class DpiitForm implements OnInit {
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
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // 1. DSC & Company Details
  orgDsc = 'Yes';
  fullName = '';
  companyEmail = '';
  companyMobile = '';
  cinNumber = '';
  companyPan = '';
  companyPanName = '';
  companyAddress = ''; // Used for both section 1 & 3

  // 2. Authorized Signatory Details
  signatoryPan = '';
  signatoryFirstName = '';
  signatoryLastName = '';
  signatoryDob = '';

  // 3. Company / Business Details
  companyBrief = '';
  companyWebsite = '';

  // 4. Authorized Representative Details
  repName = '';
  repMobile = '';
  repEmail = '';

  // 5. Director / Founder Details
  directorName = '';
  directorGender = 'Male';
  directorMobile = '';
  directorAddress = '';
  directorEmail = '';
  directorDob = '';
  employeeCount = '';

  // 6. Startup Information
  iprApplied = '';
  fundsReceived = '';
  awardsReceived = '';

  isVerified = false;

  // Files
  companyLogoFile?: File;
  incorpCertFile?: File;

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
        
        if (user.owner_name) this.fullName = user.owner_name;
        if (user.email) this.companyEmail = user.email;
        if (user.phone) this.companyMobile = user.phone;
        if (user.company_name) this.fullName = user.company_name; // fallback to full name
        if (user.pan) this.companyPan = user.pan;

        if (user.onboarding_documents) {
          const docs = user.onboarding_documents;
          const keywordMap: any = {
            'incorpCert': ['incorporation', 'incorp'],
            'companyLogo': ['logo', 'brand']
          };
          
          for (const field of Object.keys(keywordMap)) {
            const keywords = keywordMap[field];
            const eName = this.fullName;
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

  onFileChange(event: any, fieldName: string) {
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

    if (fieldName === 'companyLogoFile') {
      if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
         this.confirmDialog.confirm({ title: 'Invalid File', message: 'Company Logo must be JPEG format.', confirmText: 'Okay', hideCancel: true });
         event.target.value = '';
         return;
      }
      this.companyLogoFile = file;
    } else if (fieldName === 'incorpCertFile') {
      if (file.type !== 'application/pdf') {
         this.confirmDialog.confirm({ title: 'Invalid File', message: 'Incorporation Certificate must be PDF format.', confirmText: 'Okay', hideCancel: true });
         event.target.value = '';
         return;
      }
      this.incorpCertFile = file;
    }
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
      orgDsc: this.orgDsc, fullName: this.fullName, companyEmail: this.companyEmail, companyMobile: this.companyMobile,
      cinNumber: this.cinNumber, companyPan: this.companyPan, companyPanName: this.companyPanName, companyAddress: this.companyAddress,
      signatoryPan: this.signatoryPan, signatoryFirstName: this.signatoryFirstName, signatoryLastName: this.signatoryLastName, signatoryDob: this.signatoryDob,
      companyBrief: this.companyBrief, companyWebsite: this.companyWebsite,
      repName: this.repName, repMobile: this.repMobile, repEmail: this.repEmail,
      directorName: this.directorName, directorGender: this.directorGender, directorMobile: this.directorMobile, directorAddress: this.directorAddress, directorEmail: this.directorEmail, directorDob: this.directorDob, employeeCount: this.employeeCount,
      iprApplied: this.iprApplied, fundsReceived: this.fundsReceived, awardsReceived: this.awardsReceived
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.fullName || !this.companyEmail || !this.companyMobile || !this.cinNumber || !this.companyPan || !this.companyPanName || !this.companyAddress) { this.errorMessage.set('Please fill all required DSC & Company Details fields.'); return; }
    if (!this.signatoryPan || !this.signatoryFirstName || !this.signatoryLastName || !this.signatoryDob) { this.errorMessage.set('Please fill all required Authorized Signatory Details.'); return; }
    if (!this.companyBrief || !this.companyWebsite) { this.errorMessage.set('Please fill all required Company / Business Details.'); return; }
    if (!this.repName || !this.repMobile || !this.repEmail) { this.errorMessage.set('Please fill all required Authorized Representative Details.'); return; }
    if (!this.directorName || !this.directorMobile || !this.directorAddress || !this.directorEmail || !this.directorDob || !this.employeeCount) { this.errorMessage.set('Please fill all required Director / Founder Details.'); return; }
    if (!this.iprApplied || !this.fundsReceived || !this.awardsReceived) { this.errorMessage.set('Please fill all Startup Information.'); return; }

    if (!this.companyLogoFile && !this.existingDocs['companyLogo']) { this.errorMessage.set('Company Logo is required.'); return; }
    if (!this.incorpCertFile && !this.existingDocs['incorpCert']) { this.errorMessage.set('Incorporation Certificate is required.'); return; }

    if (!this.isVerified) { this.errorMessage.set('Please check the verification checkbox.'); return; }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    const data = {
      orgDsc: this.orgDsc, fullName: this.fullName, companyEmail: this.companyEmail, companyMobile: this.companyMobile,
      cinNumber: this.cinNumber, companyPan: this.companyPan, companyPanName: this.companyPanName, companyAddress: this.companyAddress,
      signatoryPan: this.signatoryPan, signatoryFirstName: this.signatoryFirstName, signatoryLastName: this.signatoryLastName, signatoryDob: this.signatoryDob,
      companyBrief: this.companyBrief, companyWebsite: this.companyWebsite,
      repName: this.repName, repMobile: this.repMobile, repEmail: this.repEmail,
      directorName: this.directorName, directorGender: this.directorGender, directorMobile: this.directorMobile, directorAddress: this.directorAddress, directorEmail: this.directorEmail, directorDob: this.directorDob, employeeCount: this.employeeCount,
      iprApplied: this.iprApplied, fundsReceived: this.fundsReceived, awardsReceived: this.awardsReceived
    };

    formData.append('data', JSON.stringify(data));

    if (this.companyLogoFile) formData.append('companyLogo', this.companyLogoFile);
    else if (this.existingDocs['companyLogo']) formData.append('companyLogo_existing', this.existingDocs['companyLogo'].fileUrl);

    if (this.incorpCertFile) formData.append('incorpCert', this.incorpCertFile);
    else if (this.existingDocs['incorpCert']) formData.append('incorpCert_existing', this.existingDocs['incorpCert'].fileUrl);

    this.api.post(`orders/${this.orderId()}/submit-dpiit-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
        this.draftService.clearDraft(this.orderId(), this.constructor.name);
        setTimeout(() => this.router.navigate(['/client/service', this.orderId()]), 2000);
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
