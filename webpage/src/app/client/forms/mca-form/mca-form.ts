import { Component, OnInit, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { DraftService } from '../../../services/draft.service';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';

@Component({
  selector: 'app-mca-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './mca-form.html',
  styleUrls: ['../forms-shared.css', './mca-form.css']
})
export class McaFormComponent implements OnInit, OnDestroy {
  orderId = signal<string | null>(null);
  isSubmitting = signal(false);
  errorMessage = signal('');
  isSuccess = signal(false);

  username = '';
  password = '';
  annualTurnover = '';

  coiFile: File | null = null;
  panFile: File | null = null;
  moaFile: File | null = null;
  aoaFile: File | null = null;
  bankStatementFile: File | null = null;
  salesInvoiceFile: File | null = null;
  purchaseBillsFile: File | null = null;

  existingDocs: any = {};
  status: string = '';

  removeExistingDoc(fieldName: string) {
    delete this.existingDocs[fieldName];
  }

  constructor(
    private route: ActivatedRoute,
    private api: Api,
    private router: Router,
    private location: Location,
    private draftService: DraftService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId.set(id);
        this.loadExistingData(id);
      }
    });
  }

  ngOnDestroy() {}

  loadExistingData(id: string) {
    this.api.get<any>(`orders/${id}/form-details`).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.status = res.data.status;
          if (res.data.formDetails) {
            const form = res.data.formDetails;
            this.username = form.mcaUsername || '';
            this.password = form.mcaPassword || '';
            this.annualTurnover = form.annualTurnover || '';
          }
          if (res.data.uploadedDocuments) {
            res.data.uploadedDocuments.forEach((doc: any) => {
              if (doc.documentType === 'coi') this.existingDocs['coi'] = doc;
              if (doc.documentType === 'pan') this.existingDocs['pan'] = doc;
              if (doc.documentType === 'moa') this.existingDocs['moa'] = doc;
              if (doc.documentType === 'aoa') this.existingDocs['aoa'] = doc;
              if (doc.documentType === 'bankStatement') this.existingDocs['bankStatement'] = doc;
              if (doc.documentType === 'salesInvoice') this.existingDocs['salesInvoice'] = doc;
              if (doc.documentType === 'purchaseBills') this.existingDocs['purchaseBills'] = doc;
            });
          }
          this.loadDraft();
        }
      },
      error: (err: any) => {
        console.error('Error loading form data:', err);
      }
    });
  }

  loadDraft() {
    if (!this.orderId()) return;
    const draft = this.draftService.loadDraft(this.orderId()!, this.constructor.name);
    if (draft) {
      if (draft.username !== undefined) this.username = draft.username;
      if (draft.password !== undefined) this.password = draft.password;
      if (draft.annualTurnover !== undefined) this.annualTurnover = draft.annualTurnover;
    }
  }

  async goBack() {
    const shouldDraft = confirm('Do you want to save this form as a draft before leaving?');
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
      password: this.password,
      annualTurnover: this.annualTurnover
    };
    this.draftService.saveDraft(this.orderId()!, this.constructor.name, draftData);
    alert('Draft saved successfully!');
  }

  onFileSelected(event: any, field: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size should not exceed 2 MB.');
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

    if (!this.annualTurnover) {
      this.errorMessage.set('Please select your annual turnover category.');
      return;
    }

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
    formData.append('annualTurnover', this.annualTurnover);

    if (this.coiFile) formData.append('coi', this.coiFile); else if (this.existingDocs['coi']) formData.append('coi_existing', this.existingDocs['coi'].fileUrl);
    if (this.panFile) formData.append('pan', this.panFile); else if (this.existingDocs['pan']) formData.append('pan_existing', this.existingDocs['pan'].fileUrl);
    if (this.moaFile) formData.append('moa', this.moaFile); else if (this.existingDocs['moa']) formData.append('moa_existing', this.existingDocs['moa'].fileUrl);
    if (this.aoaFile) formData.append('aoa', this.aoaFile); else if (this.existingDocs['aoa']) formData.append('aoa_existing', this.existingDocs['aoa'].fileUrl);
    if (this.bankStatementFile) formData.append('bankStatement', this.bankStatementFile); else if (this.existingDocs['bankStatement']) formData.append('bankStatement_existing', this.existingDocs['bankStatement'].fileUrl);
    if (this.salesInvoiceFile) formData.append('salesInvoice', this.salesInvoiceFile); else if (this.existingDocs['salesInvoice']) formData.append('salesInvoice_existing', this.existingDocs['salesInvoice'].fileUrl);
    if (this.purchaseBillsFile) formData.append('purchaseBills', this.purchaseBillsFile); else if (this.existingDocs['purchaseBills']) formData.append('purchaseBills_existing', this.existingDocs['purchaseBills'].fileUrl);

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
        this.errorMessage.set(err.error?.message || 'Error submitting form.');
      }
    });
  }
}
