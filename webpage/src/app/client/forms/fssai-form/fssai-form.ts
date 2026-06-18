import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-fssai-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './fssai-form.html',
  styleUrl: './fssai-form.css',
})
export class FssaiForm implements OnInit {
  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Personal Info
  fullName = '';
  mobile = '';
  email = '';

  // Business Details
  businessName = '';
  businessType = 'Proprietorship';
  otherBusinessType = '';
  
  natureOptions = [
    'Manufacturer', 'Trader', 'Retailer', 'Distributor', 'Wholesaler',
    'Restaurant / Food Service', 'Caterer', 'Importer', 'Exporter',
    'Storage / Warehouse', 'Transporter', 'E-commerce Food Seller', 'Other'
  ];
  selectedNature: { [key: string]: boolean } = {};
  otherNature = '';

  startDate = '';
  annualTurnover = 'Below ₹12 Lakhs';
  employees = '';

  // Address
  premisesType = 'Own';
  premisesAddress = '';
  premisesVillage = '';
  premisesDistrict = '';

  isCorrespondenceSame = 'Yes';
  corrAddress = '';
  corrVillage = '';
  corrDistrict = '';

  // Files
  aadhaarFile?: File;
  panFile?: File;
  photoFile?: File;
  addressProofFile?: File;

  isDeclared = false;

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
        if (draft.fullName !== undefined) this.fullName = draft.fullName;
        if (draft.mobile !== undefined) this.mobile = draft.mobile;
        if (draft.email !== undefined) this.email = draft.email;
        if (draft.businessName !== undefined) this.businessName = draft.businessName;
        if (draft.businessType !== undefined) this.businessType = draft.businessType;
        if (draft.startDate !== undefined) this.startDate = draft.startDate;
        if (draft.annualTurnover !== undefined) this.annualTurnover = draft.annualTurnover;
        if (draft.employees !== undefined) this.employees = draft.employees;
        if (draft.premisesType !== undefined) this.premisesType = draft.premisesType;
        if (draft.premisesAddress !== undefined) this.premisesAddress = draft.premisesAddress;
        if (draft.premisesVillage !== undefined) this.premisesVillage = draft.premisesVillage;
        if (draft.premisesDistrict !== undefined) this.premisesDistrict = draft.premisesDistrict;
        if (draft.isCorrespondenceSame !== undefined) this.isCorrespondenceSame = draft.isCorrespondenceSame;
        if (draft.corrAddress !== undefined) this.corrAddress = draft.corrAddress;
        if (draft.corrVillage !== undefined) this.corrVillage = draft.corrVillage;
        if (draft.corrDistrict !== undefined) this.corrDistrict = draft.corrDistrict;
      }
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Upload a file less than 2 MB or equal to 2 MB.');
      return;
    }

    if (fieldName === 'aadhaarCard') this.aadhaarFile = file;
    else if (fieldName === 'panCard') this.panFile = file;
    else if (fieldName === 'passportPhoto') this.photoFile = file;
    else if (fieldName === 'businessAddressProof') this.addressProofFile = file;
  }

  goBack() {
    this.location.back();
  }

  
  saveDraft() {
    const draftData = {
      fullName: this.fullName,
      mobile: this.mobile,
      email: this.email,
      businessName: this.businessName,
      businessType: this.businessType,
      startDate: this.startDate,
      annualTurnover: this.annualTurnover,
      employees: this.employees,
      premisesType: this.premisesType,
      premisesAddress: this.premisesAddress,
      premisesVillage: this.premisesVillage,
      premisesDistrict: this.premisesDistrict,
      isCorrespondenceSame: this.isCorrespondenceSame,
      corrAddress: this.corrAddress,
      corrVillage: this.corrVillage,
      corrDistrict: this.corrDistrict,
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    if (!this.fullName || !this.mobile || !this.email) {
      this.errorMessage.set('Please fill all required Personal Info fields.');
      return;
    }

    if (!this.businessName || !this.startDate || !this.employees) {
      this.errorMessage.set('Please fill all required Business Details.');
      return;
    }

    if (this.businessType === 'Other' && !this.otherBusinessType) {
      this.errorMessage.set('Please specify the Other Type of Business.');
      return;
    }

    const selectedNatureList = Object.keys(this.selectedNature).filter(k => this.selectedNature[k]);
    if (selectedNatureList.length === 0) {
      this.errorMessage.set('Please select at least one Nature of Food Business.');
      return;
    }

    if (this.selectedNature['Other'] && !this.otherNature) {
      this.errorMessage.set('Please specify the Other Nature of Food Business.');
      return;
    }

    if (!this.premisesAddress || !this.premisesVillage || !this.premisesDistrict) {
      this.errorMessage.set('Please fill all required Premises Address fields.');
      return;
    }

    if (this.isCorrespondenceSame === 'No') {
      if (!this.corrAddress || !this.corrVillage || !this.corrDistrict) {
        this.errorMessage.set('Please fill all required Correspondence Address fields.');
        return;
      }
    }

    if (!this.aadhaarFile || !this.panFile || !this.photoFile || !this.addressProofFile) {
      this.errorMessage.set('Please upload all required documents.');
      return;
    }

    if (!this.isDeclared) {
      this.errorMessage.set('Please check the declaration checkbox.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('fullName', this.fullName);
    formData.append('mobile', this.mobile);
    formData.append('email', this.email);

    formData.append('businessName', this.businessName);
    formData.append('businessType', this.businessType === 'Other' ? `Other: ${this.otherBusinessType}` : this.businessType);

    const finalNature = selectedNatureList.map(n => n === 'Other' ? `Other: ${this.otherNature}` : n);
    formData.append('natureOfBusiness', JSON.stringify(finalNature));

    formData.append('startDate', this.startDate);
    formData.append('annualTurnover', this.annualTurnover);
    formData.append('employees', this.employees);

    formData.append('premisesType', this.premisesType);
    formData.append('premisesAddress', this.premisesAddress);
    formData.append('premisesVillage', this.premisesVillage);
    formData.append('premisesDistrict', this.premisesDistrict);

    formData.append('isCorrespondenceSame', this.isCorrespondenceSame);
    if (this.isCorrespondenceSame === 'No') {
      formData.append('corrAddress', this.corrAddress);
      formData.append('corrVillage', this.corrVillage);
      formData.append('corrDistrict', this.corrDistrict);
    }

    formData.append('aadhaarCard', this.aadhaarFile as File);
    formData.append('panCard', this.panFile as File);
    formData.append('passportPhoto', this.photoFile as File);
    formData.append('businessAddressProof', this.addressProofFile as File);

    this.api.post(`orders/${this.orderId()}/submit-fssai-form`, formData).subscribe({
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
