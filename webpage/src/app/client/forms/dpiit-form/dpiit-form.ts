import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';

@Component({
  selector: 'app-dpiit-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dpiit-form.html',
  styleUrl: './dpiit-form.css',
})
export class DpiitForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Form Fields
  orgDsc = 'Yes';
  website = '';
  brief = '';
  directorDetails = '';
  industry = '';
  sector = '';
  address = '';
  authDetails = '';
  employees = '';
  ipr = '';
  startupNature = 'Innovative';
  receivedFunds = 'No';
  receivedAwards = 'No';
  problem = '';
  solution = '';
  uniqueness = '';
  revenue = '';

  isVerified = false;

  // File Uploads
  incorpCertFile?: File;
  panFile?: File;
  logoFile?: File;
  pitchDeckFile?: File;

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

    if (fieldName === 'incorpCert') this.incorpCertFile = file;
    else if (fieldName === 'pan') this.panFile = file;
    else if (fieldName === 'logo') this.logoFile = file;
    else if (fieldName === 'pitchDeck') this.pitchDeckFile = file;
  }

  goBack() {
    this.location.back();
  }

  submitForm() {
    if (!this.website || !this.brief || !this.directorDetails || !this.industry || !this.sector || !this.address ||
        !this.authDetails || !this.employees || !this.ipr || !this.problem || !this.solution || !this.uniqueness || !this.revenue) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if (!this.isVerified) {
      this.errorMessage.set('Please check the verification box at the end.');
      return;
    }

    if (!this.incorpCertFile || !this.panFile || !this.logoFile) {
      this.errorMessage.set('Please upload all mandatory documents (Incorp Cert, PAN, Logo).');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('orgDsc', this.orgDsc);
    formData.append('website', this.website);
    formData.append('brief', this.brief);
    formData.append('directorDetails', this.directorDetails);
    formData.append('industry', this.industry);
    formData.append('sector', this.sector);
    formData.append('address', this.address);
    formData.append('authDetails', this.authDetails);
    formData.append('employees', this.employees);
    formData.append('ipr', this.ipr);
    formData.append('startupNature', this.startupNature);
    formData.append('receivedFunds', this.receivedFunds);
    formData.append('receivedAwards', this.receivedAwards);
    formData.append('problem', this.problem);
    formData.append('solution', this.solution);
    formData.append('uniqueness', this.uniqueness);
    formData.append('revenue', this.revenue);

    formData.append('incorpCert', this.incorpCertFile);
    formData.append('pan', this.panFile);
    formData.append('logo', this.logoFile);
    
    if (this.pitchDeckFile) {
      formData.append('pitchDeck', this.pitchDeckFile);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-dpiit-form`, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.order) {
          alert('DPIIT Form submitted successfully!');
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
