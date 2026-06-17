import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-patent-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patent-form.html',
  styleUrl: './patent-form.css',
})
export class PatentForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Step 1: Applicant Details
  applicantName = '';
  entityType = '';
  mobileNumber = '';
  emailId = '';
  address = '';

  // Step 2: Invention Details
  inventionTitle = '';
  inventionDescription = '';
  industryCategory = '';
  inventorNames = '';

  // Step 3: Inventor Details
  inventorName = '';
  inventorAddress = '';
  inventorNationality = '';

  // Step 4: Document Uploads
  identityProofFile?: File;
  addressProofFile?: File;
  inventionDescriptionDocFile?: File;
  drawingsDiagramsFile?: File; // Optional
  authLetterFile?: File; // Optional

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api
  ,
    private draftService: DraftService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
    });
      const draft = this.draftService.loadDraft(this.orderId(), this.constructor.name);
      if (draft) {
        if (draft.applicantName !== undefined) this.applicantName = draft.applicantName;
        if (draft.entityType !== undefined) this.entityType = draft.entityType;
        if (draft.mobileNumber !== undefined) this.mobileNumber = draft.mobileNumber;
        if (draft.emailId !== undefined) this.emailId = draft.emailId;
        if (draft.address !== undefined) this.address = draft.address;
        if (draft.inventionTitle !== undefined) this.inventionTitle = draft.inventionTitle;
        if (draft.inventionDescription !== undefined) this.inventionDescription = draft.inventionDescription;
        if (draft.industryCategory !== undefined) this.industryCategory = draft.industryCategory;
        if (draft.inventorNames !== undefined) this.inventorNames = draft.inventorNames;
        if (draft.inventorName !== undefined) this.inventorName = draft.inventorName;
        if (draft.inventorAddress !== undefined) this.inventorAddress = draft.inventorAddress;
        if (draft.inventorNationality !== undefined) this.inventorNationality = draft.inventorNationality;
      }
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Upload a file less than 2 MB.');
      return;
    }

    if (fieldName === 'identityProof') this.identityProofFile = file;
    else if (fieldName === 'addressProof') this.addressProofFile = file;
    else if (fieldName === 'inventionDescriptionDoc') this.inventionDescriptionDocFile = file;
    else if (fieldName === 'drawingsDiagrams') this.drawingsDiagramsFile = file;
    else if (fieldName === 'authLetter') this.authLetterFile = file;
  }

  goBack() {
    this.location.back();
  }

  
  saveDraft() {
    const draftData = {
      applicantName: this.applicantName,
      entityType: this.entityType,
      mobileNumber: this.mobileNumber,
      emailId: this.emailId,
      address: this.address,
      inventionTitle: this.inventionTitle,
      inventionDescription: this.inventionDescription,
      industryCategory: this.industryCategory,
      inventorNames: this.inventorNames,
      inventorName: this.inventorName,
      inventorAddress: this.inventorAddress,
      inventorNationality: this.inventorNationality,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.applicantName || !this.entityType || !this.mobileNumber || !this.emailId || !this.address ||
        !this.inventionTitle || !this.inventionDescription || !this.industryCategory || !this.inventorNames ||
        !this.inventorName || !this.inventorAddress || !this.inventorNationality) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if (!this.identityProofFile || !this.addressProofFile || !this.inventionDescriptionDocFile) {
      this.errorMessage.set('Please upload all required documents.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    // Step 1
    formData.append('applicantName', this.applicantName);
    formData.append('entityType', this.entityType);
    formData.append('mobileNumber', this.mobileNumber);
    formData.append('emailId', this.emailId);
    formData.append('address', this.address);
    // Step 2
    formData.append('inventionTitle', this.inventionTitle);
    formData.append('inventionDescription', this.inventionDescription);
    formData.append('industryCategory', this.industryCategory);
    formData.append('inventorNames', this.inventorNames);
    // Step 3
    formData.append('inventorName', this.inventorName);
    formData.append('inventorAddress', this.inventorAddress);
    formData.append('inventorNationality', this.inventorNationality);

    // Files
    formData.append('identityProof', this.identityProofFile);
    formData.append('addressProof', this.addressProofFile);
    formData.append('inventionDescriptionDoc', this.inventionDescriptionDocFile);
    
    if (this.drawingsDiagramsFile) {
      formData.append('drawingsDiagrams', this.drawingsDiagramsFile);
    }
    if (this.authLetterFile) {
      formData.append('authLetter', this.authLetterFile);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-patent-form`, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.order) {
          alert('Patent Registration details submitted successfully!');
        this.draftService.clearDraft(this.orderId(), this.constructor.name);
          this.router.navigate(['/client/service', this.orderId()]);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
