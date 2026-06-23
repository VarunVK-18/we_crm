import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-dpiit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './dpiit-form.html',
  styleUrl: '../forms-shared.css',
})
export class DpiitForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
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

  constructor(private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api
  ,
    private draftService: DraftService,
    private confirmDialog: ConfirmDialogService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
    });
          // Auto-fill from user profile
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        
        if (user.owner_name) {
          if ('fullName' in this) (this as any).fullName = user.owner_name;
          else if ('applicantName' in this) (this as any).applicantName = user.owner_name;
          else if ('proprietorName' in this) (this as any).proprietorName = user.owner_name;
          else if ('directorName' in this) (this as any).directorName = user.owner_name;
        }

        if (user.email) {
          if ('emailId' in this) (this as any).emailId = user.email;
          else if ('email' in this) (this as any).email = user.email;
        }

        if (user.phone) {
          if ('mobileNumber' in this) (this as any).mobileNumber = user.phone;
          else if ('mobile' in this) (this as any).mobile = user.phone;
          else if ('contactNumber' in this) (this as any).contactNumber = user.phone;
        }

        if (user.company_name) {
          if ('businessName' in this) (this as any).businessName = user.company_name;
          else if ('companyName' in this) (this as any).companyName = user.company_name;
          else if ('entityName' in this) (this as any).entityName = user.company_name;
        }

        if (user.business_type) {
          if ('businessType' in this) (this as any).businessType = user.business_type;
          else if ('entityType' in this) (this as any).entityType = user.business_type;
        }

        if (user.pan) {
          if ('panNumber' in this) (this as any).panNumber = user.pan;
          else if ('pan' in this) (this as any).pan = user.pan;
        }
        if (user.onboarding_documents) {
          const docs = user.onboarding_documents;
          const keywordMap: any = {
            'panCard': ['pan'],
            'panFile': ['pan'],
            'addressProof': ['address proof', 'aadhaar', 'passport', 'voter'],
            'addressProofFile': ['address proof', 'aadhaar', 'passport', 'voter'],
            'businessAddressProof': ['business address', 'rent agreement', 'eb bill', 'property tax'],
            'incorpCert': ['incorporation', 'incorp'],
            'photoFile': ['photo', 'passport size'],
            'passportPhoto': ['photo', 'passport size'],
            'aadhaarFile': ['aadhaar'],
            'identityProof': ['identity', 'id proof'],
            'cancelledCheque': ['cheque', 'bank'],
            'authSignatoryProof': ['authorization', 'signatory'],
            'signatureFile': ['signature'],
            'trademarkLogo': ['logo', 'brand'],
            'msmeCert': ['msme', 'udyam'],
            'gstCert': ['gst']
          };
          
          for (const field of Object.keys(keywordMap)) {
            const keywords = keywordMap[field];
            const matchedDoc = docs.find((d: any) => d.name && keywords.some((k: string) => d.name.toLowerCase().includes(k)));
            if (matchedDoc) {
              this.existingDocs[field] = matchedDoc;
            }
          }
        }

      } catch(e) {}
    }

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
      this.confirmDialog.confirm({
        title: 'File Too Large',
        message: 'Please upload a file that is 2 MB or smaller.',
        confirmText: 'Okay',
        hideCancel: true,
        isDestructive: true
      });
      event.target.value = '';
      return;
    }

    if (fieldName === 'incorpCert') this.incorpCertFile = file;
    else if (fieldName === 'pan') this.panFile = file;
    else if (fieldName === 'logo') this.logoFile = file;
    else if (fieldName === 'pitchDeck') this.pitchDeckFile = file;
  }

  async goBack() {
    const shouldDraft = await this.confirmDialog.confirm({
      title: 'Save Draft?',
      message: 'Do you want to save this form as a draft before leaving?',
      confirmText: 'Save Draft',
      cancelText: 'Leave without saving'
    });
    if (shouldDraft === null) {
      return;
    }
    if (shouldDraft) {
      this.saveDraft();
    }
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

    if ((!this.incorpCertFile && !this.existingDocs['incorpCert']) || (!this.panFile && !this.existingDocs['pan']) || (!this.logoFile && !this.existingDocs['logo'])) {
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

    if (this.incorpCertFile) formData.append('incorpCert', this.incorpCertFile); else if (this.existingDocs['incorpCert']) formData.append('incorpCert_existing', this.existingDocs['incorpCert'].fileUrl);
    if (this.panFile) formData.append('pan', this.panFile); else if (this.existingDocs['pan']) formData.append('pan_existing', this.existingDocs['pan'].fileUrl);
    if (this.logoFile) formData.append('logo', this.logoFile); else if (this.existingDocs['logo']) formData.append('logo_existing', this.existingDocs['logo'].fileUrl);
    
    if (this.pitchDeckFile) {
      if (this.pitchDeckFile) formData.append('pitchDeck', this.pitchDeckFile); else if (this.existingDocs['pitchDeck']) formData.append('pitchDeck_existing', this.existingDocs['pitchDeck'].fileUrl);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-dpiit-form`, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.order) {
          this.isSuccess.set(true);
          this.draftService.clearDraft(this.orderId(), this.constructor.name);
          setTimeout(() => {
            this.router.navigate(['/client/service', this.orderId()]);
          }, 2000);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
