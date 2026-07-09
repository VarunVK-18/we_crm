import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-itr-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './itr-form.html',
  styleUrl: '../forms-shared.css',
})
export class ItrForm implements OnInit {
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Document Uploads
  bankStatementsFile?: File;
  purchaseBillsFile?: File;
  salesInvoicesFile?: File;
  companyPanFile?: File;
  additionalDocsFile?: File;

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
    
    // Auto-fill existing docs if any
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.onboarding_documents) {
          const docs = user.onboarding_documents;
          const keywordMap: any = {
            'bankStatements': ['bank', 'statement'],
            'purchaseBills': ['purchase', 'bill'],
            'salesInvoices': ['sales', 'invoice'],
            'companyPan': ['pan', 'company pan'],
            'additionalDocs': ['additional', 'other']
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

    if (fieldName === 'bankStatements') this.bankStatementsFile = file;
    else if (fieldName === 'purchaseBills') this.purchaseBillsFile = file;
    else if (fieldName === 'salesInvoices') this.salesInvoicesFile = file;
    else if (fieldName === 'companyPan') this.companyPanFile = file;
    else if (fieldName === 'additionalDocs') this.additionalDocsFile = file;
  }

  async goBack() {
    this.location.back();
  }

  submitForm() {
    if ((!this.bankStatementsFile && !this.existingDocs['bankStatements']) || 
        (!this.purchaseBillsFile && !this.existingDocs['purchaseBills']) || 
        (!this.salesInvoicesFile && !this.existingDocs['salesInvoices']) || 
        (!this.companyPanFile && !this.existingDocs['companyPan'])) {
      this.errorMessage.set('Please upload all required documents.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();

    // Files
    if (this.bankStatementsFile) formData.append('bankStatements', this.bankStatementsFile); else if (this.existingDocs['bankStatements']) formData.append('bankStatements_existing', this.existingDocs['bankStatements'].fileUrl);
    if (this.purchaseBillsFile) formData.append('purchaseBills', this.purchaseBillsFile); else if (this.existingDocs['purchaseBills']) formData.append('purchaseBills_existing', this.existingDocs['purchaseBills'].fileUrl);
    if (this.salesInvoicesFile) formData.append('salesInvoices', this.salesInvoicesFile); else if (this.existingDocs['salesInvoices']) formData.append('salesInvoices_existing', this.existingDocs['salesInvoices'].fileUrl);
    if (this.companyPanFile) formData.append('companyPan', this.companyPanFile); else if (this.existingDocs['companyPan']) formData.append('companyPan_existing', this.existingDocs['companyPan'].fileUrl);
    if (this.additionalDocsFile) {
      formData.append('additionalDocs', this.additionalDocsFile); 
    } else if (this.existingDocs['additionalDocs']) {
      formData.append('additionalDocs_existing', this.existingDocs['additionalDocs'].fileUrl);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-itr-form`, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.order) {
          this.isSuccess.set(true);
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
