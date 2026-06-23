import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

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
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './llp-form.html',
  styleUrl: '../forms-shared.css',
})
export class LlpForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
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

  constructor(private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api
  ,
    private draftService: DraftService,
    private confirmDialog: ConfirmDialogService) {}

  ngOnInit() {
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
          else if ('ownerName' in this) (this as any).ownerName = user.owner_name;
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
    } else if (fieldName === 'paymentScreenshot') {
      this.paymentScreenshotFile = file;
    } else if (personIndex !== undefined) {
      const p = this.persons[personIndex];
      (p as any)[fieldName] = file;
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
      registeredOfficePreference: this.registeredOfficePreference,
      ownerName: this.ownerName,
      totalCapital: this.totalCapital,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
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
          this.isSuccess.set(true);
          this.draftService.clearDraft(this.orderId(), this.constructor.name);
          setTimeout(() => {
            this.router.navigate(['/client/service', this.orderId()]);
          }, 2000);
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
