import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-dsc-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dsc-form.html',
  styleUrl: './dsc-form.css',
})
export class DscForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
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
      alert('Upload a file less than 2 MB or equal to 2 MB.');
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

  goBack() {
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
          alert('DSC details submitted successfully!');
        this.draftService.clearDraft(this.orderId(), this.constructor.name);
          this.router.navigate(['/client/service', this.orderId()]);
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
