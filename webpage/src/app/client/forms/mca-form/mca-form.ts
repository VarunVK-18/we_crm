import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, OnInit, signal } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-mca-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, WeLoaderComponent],
  templateUrl: './mca-form.html',
  styleUrl: '../forms-shared.css'
})
export class McaFormComponent implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string | null>(null);
  isLoading = signal(false);
  isSubmitting = signal(false);
  isSuccess = signal(false);
  errorMessage = signal('');

  username = '';
  password = '';

  coiFile: File | null = null;
  panFile: File | null = null;
  moaFile: File | null = null;
  aoaFile: File | null = null;
  bankStatementFile: File | null = null;
  salesInvoiceFile: File | null = null;
  purchaseBillsFile: File | null = null;

  constructor(private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    private api: Api,
    private draftService: DraftService,
    private confirmDialog: ConfirmDialogService) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.orderId.set(params.get('id'));
      if (this.orderId()) {
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

    const draft = this.draftService.loadDraft(this.orderId()!, this.constructor.name);
        if (draft) {
          if (draft.username !== undefined) this.username = draft.username;
          if (draft.password !== undefined) this.password = draft.password;
        }
      }
    });
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
    if (!this.orderId()) return;
    const draftData = {
      username: this.username,
      password: this.password
    };
    this.draftService.saveDraft(this.orderId()!, this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  onFileSelected(event: any, field: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should not exceed 5 MB.');
      event.target.value = '';
      return;
    }

    if (field === 'coi') this.coiFile = file;
    else if (field === 'pan') this.panFile = file;
    else if (field === 'moa') this.moaFile = file;
    else if (field === 'aoa') this.aoaFile = file;
    else if (field === 'bankStatement') this.bankStatementFile = file;
    else if (field === 'salesInvoice') this.salesInvoiceFile = file;
    else if (field === 'purchaseBills') this.purchaseBillsFile = file;
  }

  submitDetails() {
    if (!this.orderId()) return;

    if ((!this.coiFile && !this.existingDocs['coi']) || (!this.panFile && !this.existingDocs['pan']) || (!this.moaFile && !this.existingDocs['moa']) || (!this.aoaFile && !this.existingDocs['aoa']) || (!this.bankStatementFile && !this.existingDocs['bankStatement']) || (!this.salesInvoiceFile && !this.existingDocs['salesInvoice']) || (!this.purchaseBillsFile && !this.existingDocs['purchaseBills'])) {
      this.errorMessage.set('Please upload all the required documents.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('mcaUsername', this.username);
    formData.append('mcaPassword', this.password);

    if (this.coiFile) if (this.coiFile) formData.append('coi', this.coiFile); else if (this.existingDocs['coi']) formData.append('coi_existing', this.existingDocs['coi'].fileUrl);
    if (this.panFile) if (this.panFile) formData.append('pan', this.panFile); else if (this.existingDocs['pan']) formData.append('pan_existing', this.existingDocs['pan'].fileUrl);
    if (this.moaFile) if (this.moaFile) formData.append('moa', this.moaFile); else if (this.existingDocs['moa']) formData.append('moa_existing', this.existingDocs['moa'].fileUrl);
    if (this.aoaFile) if (this.aoaFile) formData.append('aoa', this.aoaFile); else if (this.existingDocs['aoa']) formData.append('aoa_existing', this.existingDocs['aoa'].fileUrl);
    if (this.bankStatementFile) if (this.bankStatementFile) formData.append('bankStatement', this.bankStatementFile); else if (this.existingDocs['bankStatement']) formData.append('bankStatement_existing', this.existingDocs['bankStatement'].fileUrl);
    if (this.salesInvoiceFile) if (this.salesInvoiceFile) formData.append('salesInvoice', this.salesInvoiceFile); else if (this.existingDocs['salesInvoice']) formData.append('salesInvoice_existing', this.existingDocs['salesInvoice'].fileUrl);
    if (this.purchaseBillsFile) if (this.purchaseBillsFile) formData.append('purchaseBills', this.purchaseBillsFile); else if (this.existingDocs['purchaseBills']) formData.append('purchaseBills_existing', this.existingDocs['purchaseBills'].fileUrl);

    this.api.post<any>(`orders/${this.orderId()}/submit-mca-form`, formData).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        if (res && res.success !== false) {
          this.isSuccess.set(true);
          this.draftService.clearDraft(this.orderId()!, this.constructor.name);
          setTimeout(() => {
            this.router.navigate(['/client/service', this.orderId()]);
          }, 2000);
        } else {
          this.errorMessage.set(res.message || 'Failed to submit form.');
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit form.');
      }
    });
  }
}
