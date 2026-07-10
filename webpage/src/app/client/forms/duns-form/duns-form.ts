import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { Location } from '@angular/common';

@Component({
  selector: 'app-duns-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './duns-form.html',
  styleUrl: '../forms-shared.css'
})
export class DunsForm implements OnInit {
  orderId = signal<string>('');
  
  // Fields
  legalBusinessName = '';
  tradeName = '';
  businessType = '';
  businessTypeOther = '';
  yearOfEstablishment = '';
  numberOfEmployees = '';
  
  registeredAddress = '';
  city = '';
  state = '';
  pinCode = '';
  country = 'India';
  
  officialEmail = '';
  businessPhone = '';
  websiteUrl = '';
  panNumber = '';
  gstNumber = '';
  cinLlpinNumber = '';
  
  natureOfBusiness = '';
  mainProducts = '';
  annualRevenue = '';
  
  founderName = '';
  designation = '';
  contactNumber = '';
  
  declaration = false;
  
  // Files
  incorpCertFile: File | null = null;
  panCardFile: File | null = null;
  addressProofFile: File | null = null;
  
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: Api,
    private location: Location
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId.set(id);
      }
    });
  }

  onFileSelected(event: any, field: string) {
    const file = event.target.files[0];
    if (file) {
      if (field === 'incorpCert') this.incorpCertFile = file;
      if (field === 'panCard') this.panCardFile = file;
      if (field === 'addressProof') this.addressProofFile = file;
    }
  }

  goBack() {
    this.location.back();
  }

  submitForm() {
    if (!this.declaration) {
      alert('Please check the declaration box.');
      return;
    }
    
    // Basic validation
    if (!this.legalBusinessName || !this.businessType || !this.yearOfEstablishment || !this.numberOfEmployees ||
        !this.registeredAddress || !this.city || !this.state || !this.pinCode || !this.country ||
        !this.officialEmail || !this.businessPhone || !this.panNumber || !this.natureOfBusiness ||
        !this.mainProducts || !this.annualRevenue || !this.founderName || !this.designation || !this.contactNumber) {
      alert('Please fill all required fields.');
      return;
    }
    
    if (!this.incorpCertFile || !this.panCardFile || !this.addressProofFile) {
      alert('Please upload all mandatory documents (Incorporation Certificate, PAN Card, Address Proof).');
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    
    formData.append('legalBusinessName', this.legalBusinessName);
    formData.append('tradeName', this.tradeName);
    formData.append('businessType', this.businessType === 'Other' ? this.businessTypeOther : this.businessType);
    formData.append('yearOfEstablishment', this.yearOfEstablishment);
    formData.append('numberOfEmployees', this.numberOfEmployees);
    formData.append('registeredAddress', this.registeredAddress);
    formData.append('city', this.city);
    formData.append('state', this.state);
    formData.append('pinCode', this.pinCode);
    formData.append('country', this.country);
    formData.append('officialEmail', this.officialEmail);
    formData.append('businessPhone', this.businessPhone);
    formData.append('websiteUrl', this.websiteUrl);
    formData.append('panNumber', this.panNumber);
    formData.append('gstNumber', this.gstNumber);
    formData.append('cinLlpinNumber', this.cinLlpinNumber);
    formData.append('natureOfBusiness', this.natureOfBusiness);
    formData.append('mainProducts', this.mainProducts);
    formData.append('annualRevenue', this.annualRevenue);
    formData.append('founderName', this.founderName);
    formData.append('designation', this.designation);
    formData.append('contactNumber', this.contactNumber);
    
    formData.append('incorpCert', this.incorpCertFile);
    formData.append('panCard', this.panCardFile);
    formData.append('addressProof', this.addressProofFile);

    this.api.post<any>(`orders/${this.orderId()}/submit-duns-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        alert('DUNS form submitted successfully!');
        this.router.navigate(['/client/dashboard']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error('Submission error:', err);
        alert('Error submitting form: ' + (err.error?.message || err.message));
      }
    });
  }
}
