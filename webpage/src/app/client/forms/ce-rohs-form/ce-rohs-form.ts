import { AutoFillUtils } from '../../../utils/autofill-utils';
import { DocumentMatcher } from '../../../utils/document-matcher';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';
import { Component, signal, OnInit, inject } from '@angular/core';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../api';
import { DraftService } from '../../../services/draft.service';

@Component({
  selector: 'app-ce-rohs-form',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './ce-rohs-form.html',
  styleUrl: '../forms-shared.css',
})
export class CeRohsForm implements OnInit {
  currentUser: any = null;
  existingDocs: any = {};
  removeExistingDoc(fieldName: string) { delete this.existingDocs[fieldName]; }

  documentViewerUrl: string | null = null;
  safeDocumentViewerUrl: SafeResourceUrl | null = null;
  sanitizer = inject(DomSanitizer);
  viewDocument(url: string) {
    this.documentViewerUrl = this.api.getFileUrl(url);
    this.safeDocumentViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.documentViewerUrl);
  }
  closeDocumentViewer() {
    this.documentViewerUrl = null;
  }

  orderId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Form Fields
  productName = '';
  modelNumber = '';
  manufacturerName = '';
  companyAddress = '';
  contactPerson = '';
  whatsapp = '';
  email = '';
  courierAddress = '';
  productSpecs = '';
  certificationType = '';

  // Document Uploads
  productDatasheetFile?: File;
  userManualFile?: File;
  circuitDiagramFile?: File;
  bomFile?: File;
  testReportsFile?: File;
  productImagesFile?: File;

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
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUser = user;
        if (user.company_name) this.manufacturerName = user.company_name;
        if (user.owner_name) this.contactPerson = user.owner_name;

        if (user.onboarding_documents) {
          const docs = user.onboarding_documents;
          const keywordMap: any = {
            'productDatasheet': ['datasheet'],
            'userManual': ['manual'],
            'circuitDiagram': ['circuit', 'pcb'],
            'bom': ['bom', 'bill of materials'],
            'testReports': ['test report', 'certificate'],
            'productImages': ['image', 'photo']
          };
          
          for (const field of Object.keys(keywordMap)) {
            const keywords = keywordMap[field];
            const eName = (this as any).companyName || (this as any).enterpriseName || (this as any).entityName || (this as any).businessName || '';
            const matchedDoc = DocumentMatcher.findExistingDoc(eName, docs, keywords);
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

    if (fieldName === 'productDatasheet') this.productDatasheetFile = file;
    else if (fieldName === 'userManual') this.userManualFile = file;
    else if (fieldName === 'circuitDiagram') this.circuitDiagramFile = file;
    else if (fieldName === 'bom') this.bomFile = file;
    else if (fieldName === 'testReports') this.testReportsFile = file;
    else if (fieldName === 'productImages') this.productImagesFile = file;
  }

  async goBack() {
    this.location.back();
  }

  submitForm() {
    if (!this.productName || !this.modelNumber || !this.manufacturerName || !this.companyAddress || !this.contactPerson || !this.productSpecs || !this.certificationType || !this.whatsapp || !this.email || !this.courierAddress) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if ((!this.productDatasheetFile && !this.existingDocs['productDatasheet']) || 
        (!this.userManualFile && !this.existingDocs['userManual']) || 
        (!this.bomFile && !this.existingDocs['bom']) || 
        (!this.productImagesFile && !this.existingDocs['productImages'])) {
      this.errorMessage.set('Please upload all required documents (Datasheet, Manual, BOM, Images).');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('productName', this.productName);
    formData.append('modelNumber', this.modelNumber);
    formData.append('manufacturerName', this.manufacturerName);
    formData.append('companyAddress', this.companyAddress);
    formData.append('contactPerson', this.contactPerson);
    formData.append('whatsapp', this.whatsapp);
    formData.append('email', this.email);
    formData.append('courierAddress', this.courierAddress);
    formData.append('productSpecs', this.productSpecs);
    formData.append('certificationType', this.certificationType);

    // Files
    if (this.productDatasheetFile) formData.append('productDatasheet', this.productDatasheetFile); else if (this.existingDocs['productDatasheet']) formData.append('productDatasheet_existing', this.existingDocs['productDatasheet'].fileUrl);
    if (this.userManualFile) formData.append('userManual', this.userManualFile); else if (this.existingDocs['userManual']) formData.append('userManual_existing', this.existingDocs['userManual'].fileUrl);
    if (this.bomFile) formData.append('bom', this.bomFile); else if (this.existingDocs['bom']) formData.append('bom_existing', this.existingDocs['bom'].fileUrl);
    if (this.productImagesFile) formData.append('productImages', this.productImagesFile); else if (this.existingDocs['productImages']) formData.append('productImages_existing', this.existingDocs['productImages'].fileUrl);
    
    if (this.circuitDiagramFile) {
      formData.append('circuitDiagram', this.circuitDiagramFile); 
    } else if (this.existingDocs['circuitDiagram']) {
      formData.append('circuitDiagram_existing', this.existingDocs['circuitDiagram'].fileUrl);
    }
    
    if (this.testReportsFile) {
      formData.append('testReports', this.testReportsFile); 
    } else if (this.existingDocs['testReports']) {
      formData.append('testReports_existing', this.existingDocs['testReports'].fileUrl);
    }

    this.api.post<any>(`orders/${this.orderId()}/submit-ce-rohs-form`, formData).subscribe({
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

  onEntityNameChange(newName: string) {
    if (this.currentUser) {
      AutoFillUtils.autoFillTextData(this, newName, this.currentUser);
    }
  }
}
