import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';
import { ValidationUtils } from '../../../utils/validation.utils';

interface Director360 {
  fullName: string;
  email: string;
  phone: string;

  photoFile?: File;
  aadhaarFile?: File;
  panFile?: File;
  dinApprovalFile?: File;
}

@Component({
  selector: 'app-compliance-360-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './compliance-360-form.html',
  styleUrl: '../forms-shared.css',
})
export class Compliance360Form implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Company Details
  companyName = '';
  companyPhone = '';
  companyEmail = '';
  
  incorpCertFile?: File;
  companyPanFile?: File;
  aoaFile?: File;
  moaFile?: File;

  directors: Director360[] = [];

  constructor(private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api,
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
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.owner_name) this.companyName = user.owner_name;
        if (user.email) this.companyEmail = user.email;
        if (user.phone) this.companyPhone = user.phone;
      } catch (e) {
        console.error('Error parsing user data from local storage', e);
      }
    }

    const draft = this.draftService.loadDraft(this.orderId()!, 'compliance_360');
    if (draft) {
      if (draft.companyName) this.companyName = draft.companyName;
      if (draft.companyPhone) this.companyPhone = draft.companyPhone;
      if (draft.companyEmail) this.companyEmail = draft.companyEmail;
      
      if (draft.directors && draft.directors.length > 0) {
        this.directors = draft.directors.map((d: any) => ({
          fullName: d.fullName || '',
          email: d.email || '',
          phone: d.phone || '',
        }));
      }
    }
  }

  saveDraft() {
    const draft = {
      companyName: this.companyName,
      companyPhone: this.companyPhone,
      companyEmail: this.companyEmail,
      directors: this.directors.map(d => ({
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
      }))
    };
    this.draftService.saveDraft(this.orderId()!, 'compliance_360', draft);
  }

  onFileChange(event: any, fieldName: string, directorIndex?: number) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        event.target.value = ''; // clear selection
        return;
      }
      
      if (directorIndex !== undefined) {
        (this.directors[directorIndex] as any)[fieldName] = file;
      } else {
        (this as any)[fieldName] = file;
      }
      this.removeExistingDoc(directorIndex !== undefined ? `dir_${directorIndex + 1}_${fieldName.replace('File', '')}_existing` : `${fieldName.replace('File', '')}_existing`);
    }
  }

  fetchOrderDetails() {
    this.isLoading.set(true);
    this.api.get(`/api/checklists/${this.orderId()}`).subscribe({
      next: (res: any) => {
        const numStr = res.checklist?.details?.assignedNumberOfDirectors || res.checklist?.details?.numberOfDirectors || '1';
        const num = parseInt(numStr, 10) || 1;
        
        if (this.directors.length === 0) {
          for (let i = 0; i < num; i++) {
            this.directors.push({
              fullName: '',
              email: '',
              phone: '',
            });
          }
          this.loadDraft(); // Reload draft to merge into new array length if needed
        }
        
        // Auto-populate from order details if available
        if (res.checklist?.details?.compliance360Form) {
            const formData = res.checklist.details.compliance360Form;
            this.companyName = formData.companyName || this.companyName;
            this.companyPhone = formData.companyPhone || this.companyPhone;
            this.companyEmail = formData.companyEmail || this.companyEmail;
            
            if (formData.directors && formData.directors.length > 0) {
               this.directors = formData.directors.map((d: any, index: number) => ({
                   ...this.directors[index],
                   fullName: d.fullName || '',
                   email: d.email || '',
                   phone: d.phone || ''
               }));
            }
        }
        
        if (res.checklist?.details?.compliance360Docs) {
          res.checklist.details.compliance360Docs.forEach((doc: any) => {
            this.existingDocs[`${doc.name}_existing`] = doc.fileUrl;
          });
        }
        
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching order details:', err);
        this.isLoading.set(false);
      }
    });
  }

  async validateForm(): Promise<boolean> {
    if (!this.companyName.trim()) { this.errorMessage.set('Company Name is required.'); return false; }
    if (!this.companyPhone.trim() || !ValidationUtils.isValidPhone(this.companyPhone)) { this.errorMessage.set('Valid Company Phone is required.'); return false; }
    if (!this.companyEmail.trim() || !ValidationUtils.isValidEmail(this.companyEmail)) { this.errorMessage.set('Valid Company Email is required.'); return false; }
    
    if (!this.incorpCertFile && !this.existingDocs['incorp_cert_existing']) { this.errorMessage.set('Incorporation Certificate is required.'); return false; }
    if (!this.companyPanFile && !this.existingDocs['company_pan_existing']) { this.errorMessage.set('Company PAN is required.'); return false; }
    if (!this.aoaFile && !this.existingDocs['aoa_existing']) { this.errorMessage.set('AOA is required.'); return false; }
    if (!this.moaFile && !this.existingDocs['moa_existing']) { this.errorMessage.set('MOA is required.'); return false; }

    for (let i = 0; i < this.directors.length; i++) {
      const d = this.directors[i];
      if (!d.fullName.trim()) { this.errorMessage.set(`Director ${i + 1}: Full Name is required.`); return false; }
      if (!d.phone.trim() || !ValidationUtils.isValidPhone(d.phone)) { this.errorMessage.set(`Director ${i + 1}: Valid Mobile Number is required.`); return false; }
      if (!d.email.trim() || !ValidationUtils.isValidEmail(d.email)) { this.errorMessage.set(`Director ${i + 1}: Valid Mail ID is required.`); return false; }

      if (!d.photoFile && !this.existingDocs[`dir_${i + 1}_photo_existing`]) { this.errorMessage.set(`Director ${i + 1}: Photo is required.`); return false; }
      if (!d.aadhaarFile && !this.existingDocs[`dir_${i + 1}_aadhaar_existing`]) { this.errorMessage.set(`Director ${i + 1}: Aadhaar is required.`); return false; }
      if (!d.panFile && !this.existingDocs[`dir_${i + 1}_pan_existing`]) { this.errorMessage.set(`Director ${i + 1}: PAN is required.`); return false; }
    }

    return true;
  }

  async submitForm() {
    if (await this.validateForm() === false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Confirm Submission',
      message: 'Please ensure all details are correct. You cannot change them after submission.'
    });

    if (!confirmed) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    const dataObj = {
      companyName: this.companyName,
      companyPhone: this.companyPhone,
      companyEmail: this.companyEmail,
      directors: this.directors.map(d => ({
        fullName: d.fullName,
        phone: d.phone,
        email: d.email
      }))
    };
    formData.append('formData', JSON.stringify(dataObj));

    if (this.incorpCertFile) formData.append('incorp_cert', this.incorpCertFile);
    else if (this.existingDocs['incorp_cert_existing']) formData.append('incorp_cert_existing', this.existingDocs['incorp_cert_existing']);
    
    if (this.companyPanFile) formData.append('company_pan', this.companyPanFile);
    else if (this.existingDocs['company_pan_existing']) formData.append('company_pan_existing', this.existingDocs['company_pan_existing']);
    
    if (this.aoaFile) formData.append('aoa', this.aoaFile);
    else if (this.existingDocs['aoa_existing']) formData.append('aoa_existing', this.existingDocs['aoa_existing']);
    
    if (this.moaFile) formData.append('moa', this.moaFile);
    else if (this.existingDocs['moa_existing']) formData.append('moa_existing', this.existingDocs['moa_existing']);

    this.directors.forEach((d, i) => {
      if (d.photoFile) formData.append(`dir_${i + 1}_photo`, d.photoFile);
      else if (this.existingDocs[`dir_${i + 1}_photo_existing`]) formData.append(`dir_${i + 1}_photo_existing`, this.existingDocs[`dir_${i + 1}_photo_existing`]);

      if (d.aadhaarFile) formData.append(`dir_${i + 1}_aadhaar`, d.aadhaarFile);
      else if (this.existingDocs[`dir_${i + 1}_aadhaar_existing`]) formData.append(`dir_${i + 1}_aadhaar_existing`, this.existingDocs[`dir_${i + 1}_aadhaar_existing`]);

      if (d.panFile) formData.append(`dir_${i + 1}_pan`, d.panFile);
      else if (this.existingDocs[`dir_${i + 1}_pan_existing`]) formData.append(`dir_${i + 1}_pan_existing`, this.existingDocs[`dir_${i + 1}_pan_existing`]);

      if (d.dinApprovalFile) formData.append(`dir_${i + 1}_din`, d.dinApprovalFile);
      else if (this.existingDocs[`dir_${i + 1}_din_existing`]) formData.append(`dir_${i + 1}_din_existing`, this.existingDocs[`dir_${i + 1}_din_existing`]);
    });

    this.api.post(`/api/orders/${this.orderId()}/submit-360-compliance-form`, formData)
      .subscribe({
        next: (res: any) => {
          this.isSubmitting.set(false);
          this.isSuccess.set(true);
          this.draftService.clearDraft(this.orderId()!, 'compliance_360');
          setTimeout(() => {
            this.router.navigate(['/client/dashboard/ongoing']);
          }, 2000);
        },
        error: (err: any) => {
          console.error('Error submitting form:', err);
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to submit form. Please try again.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
  }
}
