import { AutoFillUtils } from '../../../utils/autofill-utils';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit, computed } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-msme-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './msme-form.html',
  styleUrl: '../forms-shared.css',
})
export class MsmeForm implements OnInit {
  currentUser: any = null;

  orderId = signal<string>('');
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // 1. Applicant
  aadhaarNumber = '';
  entrepreneurName = '';
  mobileNumber = '';
  email = '';

  // 2. Organization
  orgType = 'Proprietorship';
  enterpriseName = '';
  incorporationDate = '';

  // 3. PAN & GST
  pan = '';
  panName = '';
  panDob = '';
  hasGstin = 'No';
  gstinNumber = '';

  // 4. Business
  investment = '';
  turnover = '';
  officeName = '';
  majorActivity = 'Manufacturing';
  officeAddress = '';

  // 5. Social & Category
  socialCategory = 'General';
  gender = 'Male';
  isDivyang = 'No';

  // 6. Bank
  bankName = '';
  ifsCode = '';
  bankAccount = '';

  // 7. Employees
  maleEmployees = 0;
  femaleEmployees = 0;

  // 8. TReDS
  tredsInterested = 'No';

  totalEmployees = computed(() => (this.maleEmployees || 0) + (this.femaleEmployees || 0));

  constructor(private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api,
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
        this.currentUser = user;
        
        if (user.owner_name) this.entrepreneurName = user.owner_name;
        if (user.email) this.email = user.email;
        if (user.phone) this.mobileNumber = user.phone;
        if (user.company_name) this.enterpriseName = user.company_name;
        if (user.pan) this.pan = user.pan;
        if (user.aadhaar) this.aadhaarNumber = user.aadhaar;
        if (user.business_type) {
           const typeMatch = ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'OPC', 'Trust', 'Society'].find(t => user.business_type.includes(t));
           if (typeMatch) this.orgType = typeMatch;
        }

      } catch(e) {}
    }

    const draft = this.draftService.loadDraft(this.orderId(), this.constructor.name);
    if (draft) {
      Object.assign(this, draft);
    }
  }

  async goBack() {
    const shouldDraft = await this.confirmDialog.confirm({
      title: 'Save Draft?',
      message: 'Do you want to save this form as a draft before leaving?',
      confirmText: 'Save Draft',
      cancelText: 'Leave without saving'
    });
    if (shouldDraft === null) return;
    if (shouldDraft) this.saveDraft();
    this.location.back();
  }

  saveDraft() {
    const draftData = {
      aadhaarNumber: this.aadhaarNumber, entrepreneurName: this.entrepreneurName, mobileNumber: this.mobileNumber, email: this.email,
      orgType: this.orgType, enterpriseName: this.enterpriseName, incorporationDate: this.incorporationDate,
      pan: this.pan, panName: this.panName, panDob: this.panDob, hasGstin: this.hasGstin, gstinNumber: this.gstinNumber,
      investment: this.investment, turnover: this.turnover, officeName: this.officeName, majorActivity: this.majorActivity, officeAddress: this.officeAddress,
      socialCategory: this.socialCategory, gender: this.gender, isDivyang: this.isDivyang,
      bankName: this.bankName, ifsCode: this.ifsCode, bankAccount: this.bankAccount,
      maleEmployees: this.maleEmployees, femaleEmployees: this.femaleEmployees,
      tredsInterested: this.tredsInterested
    };
    this.draftService.saveDraft(this.orderId(), this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  submitForm() {
    this.errorMessage.set('');

    if (this.hasGstin === 'Yes' && !this.gstinNumber) {
      this.errorMessage.set('Please provide your GSTIN number.');
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();
    const data = {
      aadhaarNumber: this.aadhaarNumber, entrepreneurName: this.entrepreneurName, mobileNumber: this.mobileNumber, email: this.email,
      orgType: this.orgType, enterpriseName: this.enterpriseName, incorporationDate: this.incorporationDate,
      pan: this.pan, panName: this.panName, panDob: this.panDob, hasGstin: this.hasGstin, gstinNumber: this.hasGstin === 'Yes' ? this.gstinNumber : '',
      investment: this.investment, turnover: this.turnover, officeName: this.officeName, majorActivity: this.majorActivity, officeAddress: this.officeAddress,
      socialCategory: this.socialCategory, gender: this.gender, isDivyang: this.isDivyang,
      bankName: this.bankName, ifsCode: this.ifsCode, bankAccount: this.bankAccount,
      maleEmployees: this.maleEmployees, femaleEmployees: this.femaleEmployees, totalEmployees: this.totalEmployees(),
      tredsInterested: this.tredsInterested
    };

    formData.append('data', JSON.stringify(data));

    this.api.post(`orders/${this.orderId()}/submit-msme-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
        this.draftService.clearDraft(this.orderId(), this.constructor.name);
        setTimeout(() => this.router.navigate(['/client/service', this.orderId()]), 2000);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }

  onEntityNameChange(newName: string) {
    if (this.currentUser) AutoFillUtils.autoFillTextData(this, newName, this.currentUser);
  }
}
