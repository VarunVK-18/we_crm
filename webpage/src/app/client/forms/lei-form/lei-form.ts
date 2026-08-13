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
  selector: 'app-lei-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './lei-form.html',
  styleUrl: '../forms-shared.css',
})
export class LeiForm implements OnInit {
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

  // Company Details
  companyName = '';
  cinNumber = '';
  companyAddress = '';
  
  // Applicant Details
  applicantName = '';
  email = '';
  businessPhone = '';

  isVerified = false;

  // Files
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
        
        if (user.owner_name) {
          this.applicantName = user.owner_name;
        }

        if (user.email) {
          this.email = user.email;
        }

        if (user.phone) {
          this.businessPhone = user.phone;
        }

        if (user.company_name) {
          this.companyName = user.company_name;
        }

        if (user.onboarding_documents) {
          const docs = user.onboarding_documents;
          const keywordMap: any = {
            'incorpCert': ['incorporation', 'incorp']
          };
          
          for (const field of Object.keys(keywordMap)) {
            const keywords = keywordMap[field];
            const eName = this.companyName;
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
      if (draft.companyName !== undefined) this.companyName = draft.companyName;
      if (draft.cinNumber !== undefined) this.cinNumber = draft.cinNumber;
      if (draft.companyAddress !== undefined) this.companyAddress = draft.companyAddress;
      if (draft.applicantName !== undefined) this.applicantName = draft.applicantName;
      if (draft.email !== undefined) this.email = draft.email;
      if (draft.businessPhone !== undefined) this.businessPhone = draft.businessPhone;
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
    if (fieldName === 'incorpCertFile') {
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
      cinNumber: this.cinNumber,
      companyAddress: this.companyAddress,
      applicantName: this.applicantName,
      email: this.email,
      businessPhone: this.businessPhone,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.companyName || !this.cinNumber || !this.companyAddress || !this.applicantName || !this.email || !this.businessPhone) {
      this.errorMessage.set('Please fill all required fields.');
      return;
    }

    if (!this.incorpCertFile && !this.existingDocs['incorpCert']) {
      this.errorMessage.set('Please upload the required Incorporation Certificate.');
      return;
    }

    if (!this.isVerified) {
      this.errorMessage.set('Please check the verification checkbox.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('companyName', this.companyName);
    formData.append('cinNumber', this.cinNumber);
    formData.append('companyAddress', this.companyAddress);
    formData.append('applicantName', this.applicantName);
    formData.append('email', this.email);
    formData.append('businessPhone', this.businessPhone);

    if (this.incorpCertFile) {
      formData.append('incorpCert', this.incorpCertFile);
    } else if (this.existingDocs['incorpCert']) {
      formData.append('incorpCert_existing', this.existingDocs['incorpCert'].fileUrl);
    }

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

  onEntityNameChange(newName: string) {
    if (this.currentUser) {
      AutoFillUtils.autoFillTextData(this, newName, this.currentUser);
    }
  }
}
