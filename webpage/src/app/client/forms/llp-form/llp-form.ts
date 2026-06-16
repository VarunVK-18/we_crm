import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

interface Person {
  fullName: string;
  fatherName: string;
  dob: string;
  placeOfBirth: string;
  occupation: string;
  education: string;
  email: string;
  phone: string;
  address: string;
  pan: string;
  aadhaar: string;
  din: string;
  capital: string;
  profitRatio: string;
  nationality: string;
  needDsc: string;
  designation: string;
  isAuthorized: string;

  photoFile?: File;
  signatureFile?: File;
  addressProofFile?: File;
  aadhaarFile?: File;
  panFile?: File;
}

@Component({
  selector: 'app-llp-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './llp-form.html',
  styleUrl: './llp-form.css',
})
export class LlpForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  paymentScreenshotFile?: File;

  // Company Details
  companyName = '';
  businessActivity = '';
  registeredOfficePreference = 'Do you have address for your company';
  officeProofFile?: File;
  ownerName = '';
  totalCapital = '';

  persons: Person[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
      this.fetchOrderDetails();
    });
  }

  fetchOrderDetails() {
    this.api.get<any>('my-checklists').subscribe({
      next: (res) => {
        const order = res.checklists?.find((o: any) => o._id === this.orderId());
        const countStr = order?.details?.assignedNumberOfDirectors || order?.details?.numberOfDirectors || '2';
        const count = parseInt(countStr) || 2;
        
        for (let i = 0; i < count; i++) {
          this.addPerson();
        }
      },
      error: (err) => {
        console.error('Error fetching order details:', err);
        this.addPerson();
        this.addPerson();
      }
    });
  }

  addPerson() {
    this.persons.push({
      fullName: '', fatherName: '', dob: '', placeOfBirth: '', occupation: 'Business',
      education: '', email: '', phone: '', address: '', pan: '', aadhaar: '',
      din: '', capital: '', profitRatio: '', nationality: 'Indian', needDsc: 'Yes', designation: 'Designated Partner', isAuthorized: 'Yes'
    });
  }

  onFileSelected(event: any, fieldName: string, personIndex?: number) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Upload a file less than 2 MB or equal to 2 MB.');
      return;
    }

    if (fieldName === 'officeProof') {
      this.officeProofFile = file;
    } else if (fieldName === 'paymentScreenshot') {
      this.paymentScreenshotFile = file;
    } else if (personIndex !== undefined) {
      const p = this.persons[personIndex];
      (p as any)[fieldName] = file;
    }
  }

  goBack() {
    this.location.back();
  }

  submitForm() {
    if (!this.companyName) {
      this.errorMessage.set('Company Name is required.');
      return;
    }

    if (!this.officeProofFile) {
      this.errorMessage.set('Please upload the registered office proof.');
      return;
    }

    if (!this.paymentScreenshotFile) {
      this.errorMessage.set('Please upload the payment screenshot.');
      return;
    }

    for (let i = 0; i < this.persons.length; i++) {
      const p = this.persons[i];
      if (!p.photoFile || !p.signatureFile || !p.addressProofFile || !p.aadhaarFile || !p.panFile) {
        this.errorMessage.set(`Please upload all required files for Person ${i + 1}`);
        return;
      }
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('companyName', this.companyName);
    formData.append('businessActivity', this.businessActivity);
    formData.append('registeredOfficePreference', this.registeredOfficePreference);
    formData.append('ownerName', this.ownerName);
    formData.append('totalCapital', this.totalCapital);
    
    formData.append('officeProof', this.officeProofFile as File);
    formData.append('paymentScreenshot', this.paymentScreenshotFile as File);

    // Append person fields dynamically matching the flutter app exactly
    for (let i = 0; i < this.persons.length; i++) {
      const p = this.persons[i];
      const prefix = `person_${i + 1}_`;
      
      formData.append(`${prefix}fullName`, p.fullName);
      formData.append(`${prefix}fatherName`, p.fatherName);
      formData.append(`${prefix}dob`, p.dob);
      formData.append(`${prefix}placeOfBirth`, p.placeOfBirth);
      formData.append(`${prefix}education`, p.education);
      formData.append(`${prefix}email`, p.email);
      formData.append(`${prefix}phone`, p.phone);
      formData.append(`${prefix}address`, p.address);
      formData.append(`${prefix}pan`, p.pan);
      formData.append(`${prefix}aadhaar`, p.aadhaar);
      formData.append(`${prefix}din`, p.din || '');
      formData.append(`${prefix}capital`, p.capital);
      formData.append(`${prefix}profitRatio`, p.profitRatio);
      
      formData.append(`${prefix}nationality`, p.nationality);
      formData.append(`${prefix}occupation`, p.occupation);
      formData.append(`${prefix}needDsc`, p.needDsc);
      formData.append(`${prefix}designation`, p.designation);
      formData.append(`${prefix}isAuthorized`, p.isAuthorized);

      formData.append(`${prefix}photo`, p.photoFile as File);
      formData.append(`${prefix}signature`, p.signatureFile as File);
      formData.append(`${prefix}addressProof`, p.addressProofFile as File);
      formData.append(`${prefix}aadhaar`, p.aadhaarFile as File);
      formData.append(`${prefix}pan`, p.panFile as File);
    }

    this.api.post(`orders/${this.orderId()}/submit-llp-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          alert('LLP details submitted successfully!');
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
