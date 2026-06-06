import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

interface Director {
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
  shareholding: string;
  nationality: string;
  needDsc: string;
  role: string;
  isAuthSignatory: string;

  photoFile?: File;
  signatureFile?: File;
  addressProofFile?: File;
  aadhaarFile?: File;
  panFile?: File;
}

@Component({
  selector: 'app-incorp-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incorp-form.html',
  styleUrl: './incorp-form.css',
})
export class IncorpForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Company Details
  companyName = '';
  businessActivity = '';
  officePreference = 'Already have address';
  officeProofFile?: File;
  ownerName = '';
  companyEmail = '';
  companyPhone = '';
  paidUpCapital = '';
  valuePerShare = '';
  numberOfShares = '';

  directors: Director[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
      // Add two default directors for Private Limited
      this.addDirector();
      this.addDirector();
    });
  }

  addDirector() {
    this.directors.push({
      fullName: '', fatherName: '', dob: '', placeOfBirth: '', occupation: '',
      education: '', email: '', phone: '', address: '', pan: '', aadhaar: '',
      din: '', shareholding: '', nationality: 'Indian', needDsc: 'Yes', role: 'Director', isAuthSignatory: 'Yes'
    });
  }

  removeDirector(index: number) {
    if (this.directors.length > 2) {
      this.directors.splice(index, 1);
    } else {
      alert('A Private Limited Company requires a minimum of 2 directors.');
    }
  }

  onFileSelected(event: any, fieldName: string, directorIndex?: number) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size is large. Max 10MB allowed.');
      return;
    }

    if (fieldName === 'officeProof') {
      this.officeProofFile = file;
    } else if (directorIndex !== undefined) {
      const d = this.directors[directorIndex];
      (d as any)[fieldName] = file;
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

    const capital = parseInt(this.paidUpCapital) || 0;
    if (capital < 10000) {
      this.errorMessage.set('Paid up share capital must be at least ₹10,000.');
      return;
    }

    if (this.officePreference === 'Already have address' && !this.officeProofFile) {
      this.errorMessage.set('Please upload the registered office proof.');
      return;
    }

    // Check director files
    for (let i = 0; i < this.directors.length; i++) {
      const d = this.directors[i];
      if (!d.photoFile || !d.signatureFile || !d.addressProofFile || !d.aadhaarFile || !d.panFile) {
        this.errorMessage.set(`Please upload all required files for Person ${i + 1}`);
        return;
      }
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('companyName', this.companyName);
    formData.append('businessActivity', this.businessActivity);
    formData.append('officePreference', this.officePreference);
    if (this.officePreference === 'Already have address') {
      formData.append('ownerName', this.ownerName);
      formData.append('officeProof', this.officeProofFile as File);
    }
    formData.append('companyEmail', this.companyEmail);
    formData.append('companyPhone', this.companyPhone);
    formData.append('paidUpCapital', this.paidUpCapital);
    formData.append('valuePerShare', this.valuePerShare);
    formData.append('numberOfShares', this.numberOfShares);

    // Build director list JSON without files
    const directorsList = this.directors.map(d => ({
      fullName: d.fullName,
      fatherName: d.fatherName,
      dob: d.dob,
      placeOfBirth: d.placeOfBirth,
      occupation: d.occupation,
      education: d.education,
      email: d.email,
      phone: d.phone,
      address: d.address,
      pan: d.pan,
      aadhaar: d.aadhaar,
      din: d.din,
      shareholding: d.shareholding,
      nationality: d.nationality,
      needDsc: d.needDsc,
      role: d.role,
      isAuthSignatory: d.isAuthSignatory
    }));

    formData.append('directors', JSON.stringify(directorsList));

    // Append director files
    for (let i = 0; i < this.directors.length; i++) {
      const d = this.directors[i];
      formData.append(`director_${i + 1}_photo`, d.photoFile as File);
      formData.append(`director_${i + 1}_signature`, d.signatureFile as File);
      formData.append(`director_${i + 1}_addressProof`, d.addressProofFile as File);
      formData.append(`director_${i + 1}_aadhaar`, d.aadhaarFile as File);
      formData.append(`director_${i + 1}_pan`, d.panFile as File);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-incorp-form`, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          alert('Incorporation details submitted successfully!');
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
