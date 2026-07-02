import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';
import { ValidationUtils } from '../../../utils/validation.utils';

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
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './incorp-form.html',
  styleUrl: '../forms-shared.css',
})
export class IncorpForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
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
  
  userDirectorCount: number | null = null;

  directors: Director[] = [];

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
      this.fetchOrderDetails();
      this.loadDraft();
    });
  }

  loadDraft() {
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

        if (user.director_count) {
          this.userDirectorCount = parseInt(user.director_count);
        }

      } catch(e) {}
    }

    const draft = this.draftService.loadDraft(this.orderId(), this.constructor.name);
    if (draft) {
      this.companyName = draft.companyName || '';
      this.businessActivity = draft.businessActivity || '';
      this.officePreference = draft.officePreference || 'Already have address';
      this.ownerName = draft.ownerName || '';
      this.companyEmail = draft.companyEmail || '';
      this.companyPhone = draft.companyPhone || '';
      this.paidUpCapital = draft.paidUpCapital || '';
      this.valuePerShare = draft.valuePerShare || '';
      this.numberOfShares = draft.numberOfShares || '';
    }
  }

  fetchOrderDetails() {
    this.isLoading.set(true);
    this.api.get<any>('my-checklists').subscribe({
      next: (res) => {
        const order = res.checklists?.find((o: any) => o._id === this.orderId());
        const countStr = order?.details?.assignedNumberOfDirectors || order?.details?.numberOfDirectors;
        const count = parseInt(countStr) || this.userDirectorCount || 2;
        
        for (let i = 0; i < count; i++) {
          this.addDirector();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching order details:', err);
        this.addDirector();
        this.addDirector();
        this.isLoading.set(false);
      }
    });
  }

  addDirector() {
    this.directors.push({
      fullName: '', fatherName: '', dob: '', placeOfBirth: '', occupation: '',
      education: '', email: '', phone: '', address: '', pan: '', aadhaar: '',
      din: '', shareholding: '', nationality: 'Indian', needDsc: 'Yes', role: 'Director', isAuthSignatory: this.directors.length === 0 ? 'Yes' : 'No'
    });
  }

  onFileSelected(event: any, fieldName: string, directorIndex?: number) {
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

    if (fieldName === 'officeProof') {
      this.officeProofFile = file;
    } else if (directorIndex !== undefined) {
      const d = this.directors[directorIndex];
      (d as any)[fieldName] = file;
    }
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
      companyName: this.companyName,
      businessActivity: this.businessActivity,
      officePreference: this.officePreference,
      ownerName: this.ownerName,
      companyEmail: this.companyEmail,
      companyPhone: this.companyPhone,
      paidUpCapital: this.paidUpCapital,
      valuePerShare: this.valuePerShare,
      numberOfShares: this.numberOfShares,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.companyName) {
      this.errorMessage.set('Company Name is required.');
      return;
    }

    const lowerName = this.companyName.toLowerCase();
    if (lowerName.includes('llp') || lowerName.includes('opc') || lowerName.includes('one person company')) {
      this.errorMessage.set('You are applying for Private Limited. Please do not use LLP or OPC in the company name.');
      return;
    }

    if (this.companyEmail && !ValidationUtils.isValidEmail(this.companyEmail)) {
      this.errorMessage.set('Please enter a valid company email containing @.');
      ValidationUtils.scrollToError('companyEmailInput');
      return;
    }
    if (this.companyPhone && !ValidationUtils.isValidPhone(this.companyPhone)) {
      this.errorMessage.set('Please enter a valid 10-digit company phone number.');
      ValidationUtils.scrollToError('companyPhoneInput');
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

    // Check director files & validations
    for (let i = 0; i < this.directors.length; i++) {
      const d = this.directors[i];
      if (!ValidationUtils.isValidEmail(d.email)) {
        this.errorMessage.set(`Please enter a valid email containing @ for Person ${i + 1}.`);
        ValidationUtils.scrollToError(`directorEmailInput_${i}`);
        return;
      }
      if (!ValidationUtils.isValidPhone(d.phone)) {
        this.errorMessage.set(`Please enter a valid 10-digit phone number for Person ${i + 1}.`);
        ValidationUtils.scrollToError(`directorPhoneInput_${i}`);
        return;
      }
      if (!ValidationUtils.isValidPan(d.pan)) {
        this.errorMessage.set(`Please enter a valid PAN (e.g. ABCDE1234F) for Person ${i + 1}.`);
        ValidationUtils.scrollToError(`directorPanInput_${i}`);
        return;
      }

      if (!d.photoFile || !d.signatureFile || !d.addressProofFile || !d.aadhaarFile || !d.panFile) {
        this.errorMessage.set(`Please upload all required files for Person ${i + 1}`);
        ValidationUtils.scrollToError(`directorFileInput_${i}`);
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
          this.draftService.clearDraft(this.orderId(), this.constructor.name);
          this.confirmDialog.confirm({
            title: 'Submit Incorporation Details',
            message: 'Your incorporation details have been successfully submitted.',
            confirmText: 'Continue',
            hideCancel: true
          }).then(() => {
            this.router.navigate(['/client/service', this.orderId()]);
          });
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
