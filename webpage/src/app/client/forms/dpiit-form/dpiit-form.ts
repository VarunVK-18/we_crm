import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

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
  ,
    private draftService: DraftService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
    });
      const draft = this.draftService.loadDraft(this.orderId(), this.constructor.name);
      if (draft) {
        if (draft.orgDsc !== undefined) this.orgDsc = draft.orgDsc;
        if (draft.website !== undefined) this.website = draft.website;
        if (draft.brief !== undefined) this.brief = draft.brief;
        if (draft.directorDetails !== undefined) this.directorDetails = draft.directorDetails;
        if (draft.industry !== undefined) this.industry = draft.industry;
        if (draft.sector !== undefined) this.sector = draft.sector;
        if (draft.address !== undefined) this.address = draft.address;
        if (draft.authDetails !== undefined) this.authDetails = draft.authDetails;
        if (draft.employees !== undefined) this.employees = draft.employees;
        if (draft.ipr !== undefined) this.ipr = draft.ipr;
        if (draft.startupNature !== undefined) this.startupNature = draft.startupNature;
        if (draft.receivedFunds !== undefined) this.receivedFunds = draft.receivedFunds;
        if (draft.receivedAwards !== undefined) this.receivedAwards = draft.receivedAwards;
        if (draft.problem !== undefined) this.problem = draft.problem;
        if (draft.solution !== undefined) this.solution = draft.solution;
        if (draft.uniqueness !== undefined) this.uniqueness = draft.uniqueness;
        if (draft.revenue !== undefined) this.revenue = draft.revenue;
      }
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

  
  saveDraft() {
    const draftData = {
      orgDsc: this.orgDsc,
      website: this.website,
      brief: this.brief,
      directorDetails: this.directorDetails,
      industry: this.industry,
      sector: this.sector,
      address: this.address,
      authDetails: this.authDetails,
      employees: this.employees,
      ipr: this.ipr,
      startupNature: this.startupNature,
      receivedFunds: this.receivedFunds,
      receivedAwards: this.receivedAwards,
      problem: this.problem,
      solution: this.solution,
      uniqueness: this.uniqueness,
      revenue: this.revenue,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
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
