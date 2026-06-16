import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

@Component({
  selector: 'app-iso-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './iso-form.html',
  styleUrl: './iso-form.css',
})
export class IsoForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Details
  companyLegalName = '';
  companyAddress = '';
  applicantName = '';
  email = '';
  whatsapp = '';
  courierAddress = '';

  // ISO Selection
  selectedIso = 'ISO 9001 - Quality Management System';
  otherIso = '';

  isoOptions = [
    'ISO 9001 - Quality Management System',
    'ISO 27001 - Information Security Management System',
    'ISO 14001 - Environment Management System',
    'ISO 45001 - Occupational Health & Safety',
    'ISO 20000 - Information Technology Service Management System',
    'ISO 22000 - Food Safety Management System',
    'ISO 13485 - Medical Device QMS',
    'Other'
  ];

  isVerified = false;

  msmeCertFile?: File;

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
      alert('Upload a file less than 2 MB or equal to 2 MB.');
      return;
    }

    if (fieldName === 'msmeCertificate') this.msmeCertFile = file;
  }

  goBack() {
    this.location.back();
  }

  submitForm() {
    if (!this.companyLegalName || !this.companyAddress || !this.applicantName || !this.email || !this.whatsapp || !this.courierAddress) {
      this.errorMessage.set('Please fill all required text fields.');
      return;
    }

    if (this.selectedIso === 'Other' && !this.otherIso) {
      this.errorMessage.set('Please specify the Other ISO Certification.');
      return;
    }

    if (!this.msmeCertFile) {
      this.errorMessage.set('Please upload MSME Certificate.');
      return;
    }

    if (!this.isVerified) {
      this.errorMessage.set('Please check the verification checkbox.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('companyLegalName', this.companyLegalName);
    formData.append('companyAddress', this.companyAddress);
    formData.append('applicantName', this.applicantName);
    formData.append('email', this.email);
    formData.append('whatsapp', this.whatsapp);
    formData.append('courierAddress', this.courierAddress);

    formData.append('preferredIso', this.selectedIso === 'Other' ? `Other: ${this.otherIso}` : this.selectedIso);

    formData.append('msmeCertificate', this.msmeCertFile as File);

    this.api.post(`orders/${this.orderId()}/submit-iso-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          alert('ISO details submitted successfully!');
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
