import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

@Component({
  selector: 'app-msme-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './msme-form.html',
  styleUrl: './msme-form.css',
})
export class MsmeForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
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
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
    });
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size is large. Max 2MB allowed.');
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
          alert('MSME details submitted successfully!');
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
