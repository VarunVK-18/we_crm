import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-proprietorship-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proprietorship-form.html',
  styleUrl: './proprietorship-form.css',
})
export class ProprietorshipForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
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
        if (draft.needGst ? 'true' : 'false' !== undefined) this.needGst ? 'true' : 'false' = draft.needGst ? 'true' : 'false';
        if (draft.needMsme ? 'true' : 'false' !== undefined) this.needMsme ? 'true' : 'false' = draft.needMsme ? 'true' : 'false';
        if (draft.needShopAct ? 'true' : 'false' !== undefined) this.needShopAct ? 'true' : 'false' = draft.needShopAct ? 'true' : 'false';
        if (draft.needFssai ? 'true' : 'false' !== undefined) this.needFssai ? 'true' : 'false' = draft.needFssai ? 'true' : 'false';
        if (draft.needIec ? 'true' : 'false' !== undefined) this.needIec ? 'true' : 'false' = draft.needIec ? 'true' : 'false';
      }
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Upload a file less than 2 MB.');
      return;
    }

    if (fieldName === 'panCard') this.panCardFile = file;
    else if (fieldName === 'aadhaarCard') this.aadhaarCardFile = file;
    else if (fieldName === 'passportPhoto') this.passportPhotoFile = file;
    else if (fieldName === 'addressProof') this.addressProofFile = file;
    else if (fieldName === 'businessAddressProof') this.businessAddressProofFile = file;
  }

  goBack() {
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
      needGst ? 'true' : 'false': this.needGst ? 'true' : 'false',
      needMsme ? 'true' : 'false': this.needMsme ? 'true' : 'false',
      needShopAct ? 'true' : 'false': this.needShopAct ? 'true' : 'false',
      needFssai ? 'true' : 'false': this.needFssai ? 'true' : 'false',
      needIec ? 'true' : 'false': this.needIec ? 'true' : 'false',
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.proprietorName || !this.panNumber || !this.businessName) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if (!this.panCardFile || !this.aadhaarCardFile || !this.passportPhotoFile || !this.addressProofFile || !this.businessAddressProofFile) {
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
    formData.append('panCard', this.panCardFile);
    formData.append('aadhaarCard', this.aadhaarCardFile);
    formData.append('passportPhoto', this.passportPhotoFile);
    formData.append('addressProof', this.addressProofFile);
    formData.append('businessAddressProof', this.businessAddressProofFile);

    this.api.post<any>(`orders/${this.orderId()}/submit-proprietorship-form`, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.order) {
          alert('Proprietorship details submitted successfully!');
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
