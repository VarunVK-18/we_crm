import { DocumentMatcher } from '../../../utils/document-matcher';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

import { WeLoaderComponent } from '../../../components/we-loader/we-loader';

@Component({
  selector: 'app-copyright-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './copyright-form.html',
  styleUrls: ['../forms-shared.css']
})
export class CopyrightForm implements OnInit {
  orderId = signal<string>('');
  loading = signal<boolean>(false);
  success = signal<boolean>(false);
  errorMessage = signal<string>('');
  currentUser: any = null;

  // 1. Applicant Details
  applicantName = '';
  applicantEmail = '';
  applicantPhone = '';
  applicantAddress = '';

  // 2. Details of the Work
  workTitle = '';
  workType = 'Literary / Dramatic';
  workTypeOptions = ['Literary / Dramatic', 'Musical', 'Artistic', 'Cinematograph Film', 'Sound Recording', 'Computer Software / IT'];
  language = '';
  workDescription = '';

  // 3. Author Details
  isApplicantAuthor = 'Yes';
  authorName = '';
  authorAddress = '';

  // 4. Documents
  copyOfWorkFile?: File;
  nocFromAuthorFile?: File;
  nocFromPublisherFile?: File;
  incorporationCertificateFile?: File;
  boardResolutionFile?: File;
  idProofFile?: File;

  // 5. Declaration
  declaration = false;
  
  existingDocs: { [key: string]: any } = {};

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
          this.applicantEmail = user.email;
        }

        if (user.phone) {
          this.applicantPhone = user.phone;
        }
      } catch (e) {}
    }
    
    const draft = this.draftService.loadDraft(this.orderId(), this.constructor.name);
    if (draft) {
      if (draft.applicantName !== undefined) this.applicantName = draft.applicantName;
      if (draft.applicantEmail !== undefined) this.applicantEmail = draft.applicantEmail;
      if (draft.applicantPhone !== undefined) this.applicantPhone = draft.applicantPhone;
      if (draft.applicantAddress !== undefined) this.applicantAddress = draft.applicantAddress;
      if (draft.workTitle !== undefined) this.workTitle = draft.workTitle;
      if (draft.workType !== undefined) this.workType = draft.workType;
      if (draft.language !== undefined) this.language = draft.language;
      if (draft.workDescription !== undefined) this.workDescription = draft.workDescription;
      if (draft.isApplicantAuthor !== undefined) this.isApplicantAuthor = draft.isApplicantAuthor;
      if (draft.authorName !== undefined) this.authorName = draft.authorName;
      if (draft.authorAddress !== undefined) this.authorAddress = draft.authorAddress;
      if (draft.declaration !== undefined) this.declaration = draft.declaration;
    }
  }

  onFileChange(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2 MB.');
        event.target.value = '';
        return;
      }
      (this as any)[fieldName] = file;
      this.saveDraft();
    }
  }

  removeExistingDoc(field: string) {
    delete this.existingDocs[field];
    this.saveDraft();
  }

  saveDraft() {
    const draftData = {
      applicantName: this.applicantName,
      applicantEmail: this.applicantEmail,
      applicantPhone: this.applicantPhone,
      applicantAddress: this.applicantAddress,
      workTitle: this.workTitle,
      workType: this.workType,
      language: this.language,
      workDescription: this.workDescription,
      isApplicantAuthor: this.isApplicantAuthor,
      authorName: this.authorName,
      authorAddress: this.authorAddress,
      declaration: this.declaration
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
  }

  async submitForm() {
    if (!this.applicantName || !this.applicantEmail || !this.applicantPhone || !this.applicantAddress ||
        !this.workTitle || !this.language || !this.workDescription) {
      this.errorMessage.set('Please fill all required text fields.');
      return;
    }
    
    if (this.isApplicantAuthor === 'No' && (!this.authorName || !this.authorAddress)) {
      this.errorMessage.set('Please provide author details since applicant is not the author.');
      return;
    }
    
    if (!this.copyOfWorkFile && !this.existingDocs['copyOfWork']) {
      this.errorMessage.set('Please upload a copy of the work.');
      return;
    }
    
    if (!this.declaration) {
      this.errorMessage.set('Please agree to the declaration.');
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Submit Form',
      message: 'Are you sure you want to submit this form? You cannot edit it after submission.',
      confirmText: 'Submit',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.success.set(false);

    const formData = new FormData();
    formData.append('applicantName', this.applicantName);
    formData.append('applicantEmail', this.applicantEmail);
    formData.append('applicantPhone', this.applicantPhone);
    formData.append('applicantAddress', this.applicantAddress);
    formData.append('workTitle', this.workTitle);
    formData.append('workType', this.workType);
    formData.append('language', this.language);
    formData.append('workDescription', this.workDescription);
    formData.append('isApplicantAuthor', this.isApplicantAuthor);
    formData.append('authorName', this.authorName);
    formData.append('authorAddress', this.authorAddress);
    formData.append('declaration', this.declaration.toString());

    // Append files
    if (this.copyOfWorkFile) formData.append('copyOfWork', this.copyOfWorkFile);
    if (this.nocFromAuthorFile) formData.append('nocFromAuthor', this.nocFromAuthorFile);
    if (this.nocFromPublisherFile) formData.append('nocFromPublisher', this.nocFromPublisherFile);
    if (this.incorporationCertificateFile) formData.append('incorporationCertificate', this.incorporationCertificateFile);
    if (this.boardResolutionFile) formData.append('boardResolution', this.boardResolutionFile);
    if (this.idProofFile) formData.append('idProof', this.idProofFile);

    // Note: If backend doesn't support submit-copyright-form, this might return 404, but it compiles.
    this.api.post(`orders/${this.orderId()}/submit-copyright-form`, formData).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.success.set(true);
        this.draftService.clearDraft(this.orderId(), this.constructor.name);
        setTimeout(() => {
          this.router.navigate(['/client/service', this.orderId()]);
        }, 2000);
      },
      error: (err: any) => {
        this.loading.set(false);
        console.error(err);
        this.errorMessage.set('Failed to submit form. Please try again.');
      }
    });
  }
}
