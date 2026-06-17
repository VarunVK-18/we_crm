import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

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
