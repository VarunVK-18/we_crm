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
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './msme-form.html',
  styleUrl: './msme-form.css',
})
export class MsmeForm implements OnInit {
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
      alert('Upload a file less than 2 MB or equal to 2 MB.');
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

  goBack() {
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
