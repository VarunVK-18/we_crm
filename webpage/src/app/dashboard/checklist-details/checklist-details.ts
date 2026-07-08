import { Component, OnInit, OnDestroy, signal, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

import { OcrService } from '../../services/ocr.service';
import { ConfirmDialogService } from '../../confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-checklist-details',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfViewerModule, WeLoaderComponent],
  templateUrl: './checklist-details.html',
  styleUrl: './checklist-details.css'
})
export class ChecklistDetails implements OnInit, OnDestroy {
  @Output() onBack = new EventEmitter<void>();
  checklistId = input.required<string>();
  teams = input<any[]>([]);
  actualTeams = signal<any[]>([]);
  autoOpenChat = input<boolean>(false);
  private _chatOpenedLocally = false;

  user = signal<any>(null);
  checklist = signal<any>(null);
  systemBankSettings = signal<any>(null);
  requirePaymentVerification = signal<boolean>(true);
  pollInterval: any;

  // Add Item Modal
  isAddChecklistItemModalOpen = signal<boolean>(false);
  newChecklistItemTitle: string = '';
  newChecklistItemDesc: string = '';

  // Request Document Modal
  isRequestDocModalOpen = signal<boolean>(false);
  newDocRequestName = '';
  checklistErrorMessage = signal<string>('');

  // Notes Editing State
  isEditingNotes = signal<boolean>(false);
  editNotesText = '';

  // Final Documents Upload State
  finalDocsToUpload: { file: File, docType?: string }[] = [];
  isFinalDocUploading = false;

  // SOP Viewer State
  isSopModalOpen = signal<boolean>(false);
  sopPdfSrc: string = '';

  // Document Viewer State
  isDocViewerOpen = signal<boolean>(false);
  isDocViewerLoading = signal<boolean>(false);
  docViewerSrc: string = '';
  docViewerName: string = '';
  docViewerType = signal<'pdf' | 'image' | ''>('');

  // Add Payment State
  isAddingPayment = signal<boolean>(false);
  isSubmittingPayment = signal<boolean>(false);
  paymentAmountToAdd: number | null = null;
  uploadingExpenseIndices = signal<number[]>([]);

  // Application Tracking State
  isEditingApplicationId = signal<boolean>(false);
  isSavingApplicationId = signal<boolean>(false);
  isScanningApplicationReceipt = signal<boolean>(false);
  applicationIdInput: string = '';


  privateLimitedFinalDocs = [
    'Certificate of Incorporation (COI)',
    'PAN',
    'TAN',
    'e-MOA (INC-33)',
    'e-AOA (INC-34)',
    'SPICe+ (INC-32)',
    'AGILE-PRO-S (INC-35)',
    'DIN Allotment Details for Directors',
    'Other'
  ];

  opcFinalDocs = [
    'Certificate of Incorporation',
    'PAN',
    'TAN',
    'e-MOA',
    'e-AOA',
    'SPICe+',
    'DIN Details',
    'Other'
  ];

  llpFinalDocs = [
    'LLP Certificate of Incorporation',
    'PAN Letter',
    'TAN Letter',
    'LLP Agreement',
    'Form 3 Acknowledgement',
    'FiLLiP Form',
    'DPIN/DIN Details',
    'Other'
  ];

  msmeFinalDocs = [
    'Udyam Registration Certificate',
    'Other'
  ];

  // --- Chat Feature ---
  isChatModalOpen = signal<boolean>(false);
  chatMessages = signal<any[]>([]);
  isLoadingChat = signal<boolean>(false);
  newChatMessage: string = '';
  chatPollingInterval: any;

  constructor(public api: Api, private ocrService: OcrService, private confirmDialog: ConfirmDialogService) { }

  viewSop() {
    const cl = this.checklist();
    if (cl && cl.sop_document) {
      this.sopPdfSrc = `${this.api.serverUrl}api/documents/${cl.sop_document}`;
      this.isSopModalOpen.set(true);
    }
  }

  openSopModal(url: string) {
    this.sopPdfSrc = this.api.getFileUrl(url);
    this.isSopModalOpen.set(true);
  }

  closeSopModal() {
    this.isSopModalOpen.set(false);
    this.sopPdfSrc = '';
  }

  async openDocViewer(url: string, name: string, event: Event) {
    event.preventDefault();
    const finalUrl = this.api.getFileUrl(url);
    this.docViewerName = name || 'Document';
    this.docViewerType.set('');
    this.isDocViewerLoading.set(true);
    this.isDocViewerOpen.set(true);

    // Detect file type via magic bytes for guaranteed accuracy
    try {
      const res = await fetch(finalUrl, { headers: { 'Range': 'bytes=0-3' } });
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // PDF magic: %PDF
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        this.docViewerType.set('pdf');
      // JPEG magic
      } else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        this.docViewerType.set('image');
      // PNG magic
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        this.docViewerType.set('image');
      // GIF magic
      } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        this.docViewerType.set('image');
      } else {
        const cType = res.headers.get('content-type') || '';
        if (cType.includes('pdf')) this.docViewerType.set('pdf');
        else if (cType.includes('image')) this.docViewerType.set('image');
      }
    } catch (e) {
      // Fallback: heuristics
      const lowerUrl = finalUrl.toLowerCase();
      const lowerName = (name || '').toLowerCase();
      if (lowerUrl.includes('.pdf') || lowerUrl.includes('pdf')) {
        this.docViewerType.set('pdf');
      } else if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)/) || lowerName.includes('photo') || lowerName.includes('signature') || lowerName.includes('aadhar') || lowerName.includes('pan')) {
        this.docViewerType.set('image');
      }
    }

    this.docViewerSrc = finalUrl;
    this.isDocViewerLoading.set(false);
  }

  closeDocViewer() {
    this.isDocViewerOpen.set(false);
    this.isDocViewerLoading.set(false);
    this.docViewerSrc = '';
    this.docViewerName = '';
    this.docViewerType.set('');
  }

  forceDownload(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    let docName = this.docViewerName || 'document';
    const client = this.checklist()?.client_id;
    if (client) {
      const clientName = client.owner_name || client.company_name || client.name || '';
      if (clientName && !docName.toLowerCase().includes(clientName.toLowerCase())) {
        docName = `${clientName.trim().replace(/\s+/g, '_')}_${docName}`;
      }
    }
    
    this.api.downloadFile(this.docViewerSrc, docName);
  }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchChecklist();
    this.fetchSystemSettings();
    
    if (this.canManage()) {
      this.api.get<any>('teams').subscribe({
        next: (res: any) => {
          let allTeams = res.teams || [];
          const currentUser = this.user();
          
          if (currentUser && currentUser.role === 'client_manager') {
            allTeams = allTeams.filter((t: any) => 
              t.manager_id && (t.manager_id._id === currentUser._id || t.manager_id === currentUser._id)
            );
          }
          this.actualTeams.set(allTeams);
        },
        error: (err: any) => console.error('Error fetching teams:', err)
      });
    }

    // Poll for changes
    this.pollInterval = setInterval(() => {
      this.fetchChecklist();
    }, 5000);
  }

  assignTeamChecklist(teamId: string) {
    const cl = this.checklist();
    if (!cl) return;
    this.api.patch<any>(`checklists/${cl._id}`, { assigned_team: teamId || null, assigned_to: null }).subscribe({
      next: () => {
        this.fetchChecklist();
        alert('Checklist assigned to team successfully!');
      },
      error: (err) => alert(err.error?.message || 'Failed to assign checklist to team.')
    });
  }

  fetchSystemSettings() {
    this.api.get<any>('settings').subscribe({
      next: (res) => {
        if (res && res.settings) {
          if (res.settings.bank_details) {
            this.systemBankSettings.set(res.settings.bank_details);
          }
          this.requirePaymentVerification.set(res.settings.require_payment_verification !== false);
        }
      },
      error: (err: any) => console.error('Error fetching settings:', err)
    });
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval);
    }
  }

  goBack() {
    this.onBack.emit();
  }

  isAdmin(): boolean { return this.user()?.role === 'admin'; }
  isClientManager(): boolean { return this.user()?.role === 'client_manager'; }
  isFillingStaff(): boolean { return this.user()?.role === 'filling_staff'; }
  isAccountManager(): boolean { return this.user()?.role === 'account_manager'; }

  canCreate(): boolean {
    return this.isAdmin() || this.isClientManager();
  }

  canManage(): boolean {
    return this.isAdmin() || this.isClientManager();
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'HR Specialist',
      client_manager: 'Client Manager',
      filling_staff: 'Filing Staff',
      account_manager: 'Account Manager'
    };
    return labels[role] || role;
  }

  getAssigneeName(cl: any): string {
    if (!cl || !cl.assigned_to) {
      return 'Yet to Assign';
    }
    return cl.assigned_to.owner_name || cl.assigned_to.name || 'Yet to Assign';
  }

  isActionRequired(c: any): boolean {
    if (!c) return false;
    const serviceNameLower = (c.service_name || '').toLowerCase();
    const SERVICES_WITH_FORMS = [
      'dpiit', 'private limited', 'trade mark', 'trademark', 'copyright', 'llp', 'msme', 'gst', 'iso', 'fssai', 
      'one person company', 'opc', 'lei', 'lie', 'bis', 'mca', 'dsc', 'iec', 'proprietorship', 'tds', 'pan, tan', 'itr', 'pf', 'patent'
    ];
    
    const requiresForm = SERVICES_WITH_FORMS.some(s => serviceNameLower.includes(s));
    
    if (requiresForm) {
      // These are system-injected fields set at checklist creation time, NOT from client form submission
      const SYSTEM_FIELDS = new Set([
        'entityname', 'status', 'next step', 'applicant name', 'applicant email',
        'applicant phone', 'badge', 'requesttype', 'recommended_plan', 'service_fee'
      ]);

      let isFormFilled = false;
      if (c.details && typeof c.details === 'object') {
        const clientKeys = Object.keys(c.details).filter(k => !SYSTEM_FIELDS.has(k.toLowerCase()));
        // Consider form filled only if there are actual client-submitted keys beyond system fields
        isFormFilled = clientKeys.length > 0;
      }
      return !isFormFilled;
    }
    
    return false;
  }

  getChecklistDisplayStatus(c: any): string {
    if (!c) return 'Pending';
    if (c.status === 'completed') return 'Completed';
    
    const assigneeName = this.getAssigneeName(c);
    const isAssigned = assigneeName !== 'Yet to Assign';

    if (isAssigned) {
      if (this.isActionRequired(c)) {
        return 'Action Required';
      } else {
        return 'In Progress';
      }
    }

    return 'Pending';
  }

  getChecklistStatusClass(status: string): string {
    const s = (status || '').toLowerCase().replace(' ', '-');
    const map: Record<string, string> = {
      'pending': 'pending',
      'action-required': 'action_required',
      'in-progress': 'in_progress',
      'completed': 'completed'
    };
    return map[s] || 'pending';
  }

  fetchChecklist() {
    this.api.get<any>('checklists').subscribe({
      next: (res) => {
        if (res && res.success) {
          const found = res.checklists.find((c: any) => c._id === this.checklistId());
          if (found) {
            this.checklist.set(found);
            if (this.autoOpenChat() && !this.isChatModalOpen() && !this._chatOpenedLocally) {
              this._chatOpenedLocally = true;
              this.openChatModal();
            }
          }
        }
      },
      error: (err) => {
        console.error('Failed to fetch checklist:', err);
      }
    });
  }

  getFlatEmployees() {
    const flat: any[] = [];
    this.teams().forEach(g => {
      if (g.members) {
        flat.push(...g.members);
      }
    });
    return flat;
  }

  uploadExpenseBill(itemIndex: number, event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const cl = this.checklist();
    if (!cl) return;
    const item = cl.items[itemIndex];
    if (!item || !item._id) return;

    const formData = new FormData();
    formData.append('bill', file);

    this.uploadingExpenseIndices.update(v => [...v, itemIndex]);

    this.api.post<any>(`checklists/${cl._id}/items/${item._id}/expense`, formData).subscribe({
      next: (res) => {
        this.uploadingExpenseIndices.update(v => v.filter(i => i !== itemIndex));
        this.fetchChecklist();
        this.confirmDialog.confirm({
          title: 'Success',
          message: `Expense bill uploaded successfully!\nExtracted Amount: ₹${res.data?.amount || 0}\nTransaction ID: ${res.data?.transactionId || 'Not found'}`,
          confirmText: 'OK',
          hideCancel: true
        });
      },
      error: (err) => {
        this.uploadingExpenseIndices.update(v => v.filter(i => i !== itemIndex));
        this.confirmDialog.confirm({
          title: 'Error',
          message: err.error?.message || 'Failed to upload expense bill',
          confirmText: 'OK',
          hideCancel: true
        });
      }
    });
  }

  toggleChecklistItem(itemIndex: number, event?: any) {
    const cl = this.checklist();
    if (!cl) return;

    const revertCheckbox = () => {
      if (event && event.target) {
        event.target.checked = false;
        event.preventDefault();
      }
    };

    // Prevent checking if previous step is not completed
    if (itemIndex > 0 && !cl.items[itemIndex].isChecked && !cl.items[itemIndex - 1].isChecked) {
      this.confirmDialog.confirm({
        title: 'Action Denied',
        message: 'Please complete the previous step first.',
        confirmText: 'OK',
        hideCancel: true
      });
      revertCheckbox();
      return;
    }

    // Prevent unchecking if step is already completed
    if (cl.items[itemIndex].isChecked) {
      this.confirmDialog.confirm({
        title: 'Action Denied',
        message: 'Once a step is completed, it cannot be undone.',
        confirmText: 'OK',
        hideCancel: true
      });
      if (event && event.target) event.target.checked = true;
      return;
    }

    const currentItem = cl.items[itemIndex];

    // Enforce isActionStep requirement (client form filling)
    if (currentItem.isActionStep && !cl.details?.clientFormSubmitted) {
      this.confirmDialog.confirm({
        title: 'Action Required',
        message: 'Client needs to do form filling.',
        confirmText: 'OK',
        hideCancel: true
      });
      revertCheckbox();
      return;
    }

    // Enforce getBill requirement
    if (currentItem.getBill && !currentItem.expense?.billUrl) {
      this.confirmDialog.confirm({
        title: 'Action Required',
        message: 'You must upload the bill before completing this step.',
        confirmText: 'OK',
        hideCancel: true
      });
      revertCheckbox();
      return;
    }

    // Enforce requires_customer_verification requirement
    const needsVerification = currentItem.linked_document_templates && currentItem.linked_document_templates.some((t: any) => t.requires_customer_verification);
    if (needsVerification) {
      const tempDoc = cl.temporary_documents?.find((d: any) => d.step_title === currentItem.title);
      if (!tempDoc || tempDoc.status !== 'replied') {
        this.confirmDialog.confirm({
          title: 'Action Required',
          message: 'This step requires customer verification. The customer must sign/reply to the generated document before completing this step.',
          confirmText: 'OK',
          hideCancel: true
        });
        revertCheckbox();
        return;
      }
    }

    // Check if it's the last checkbox and we are trying to check it
    const isSupportItem = currentItem && currentItem.title && currentItem.title.startsWith('[Support]');
    
    if (itemIndex === cl.items.length - 1 && !cl.items[itemIndex].isChecked && !isSupportItem) {
      const svcLower = cl.service_name?.toLowerCase() || '';
      if (svcLower.includes('trademark') || svcLower.includes('trade mark') || svcLower.includes('patent') || svcLower.includes('copyright')) {
        if (!cl.details?.applicationId) {
          this.confirmDialog.confirm({
            title: 'Action Required',
            message: 'Please fill and save the Application/Tracking ID first.',
            confirmText: 'OK',
            hideCancel: true
          });
          revertCheckbox();
          return;
        }
      }

      if (!cl.final_documents || cl.final_documents.length === 0) {
        this.confirmDialog.confirm({
          title: 'Action Required',
          message: 'Need to upload final delivery document',
          confirmText: 'OK',
          hideCancel: true
        });
        revertCheckbox();
        return;
      }
    }
    this.confirmDialog.confirm({
      title: 'Confirm Completion',
      message: 'Are you sure you want to complete this step? This cannot be undone.',
      confirmText: 'Yes, Complete',
      cancelText: 'Cancel',
      autoCancelSeconds: 6
    }).then((confirmed) => {
      if (confirmed) {
        this.api.patch<any>(`checklists/${cl._id}/items/${itemIndex}`, {}).subscribe({
          next: () => this.fetchChecklist(),
          error: (err) => {
            alert(err.error?.message || 'Failed to update checklist item.');
            revertCheckbox();
          }
        });
      } else {
        revertCheckbox();
      }
    });
  }

  openAddChecklistItemModal() {
    this.newChecklistItemTitle = '';
    this.newChecklistItemDesc = '';
    this.isAddChecklistItemModalOpen.set(true);
  }

  closeAddChecklistItemModal() {
    this.isAddChecklistItemModalOpen.set(false);
  }

  submitAddChecklistItem() {
    if (!this.newChecklistItemTitle.trim()) return;
    const cl = this.checklist();
    if (!cl) return;
    this.api.post<any>(`checklists/${cl._id}/items`, {
      title: this.newChecklistItemTitle,
      description: this.newChecklistItemDesc
    }).subscribe({
      next: () => {
        this.fetchChecklist();
        this.closeAddChecklistItemModal();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add checklist item.');
      }
    });
  }

  assignChecklist(staffId: string) {
    const cl = this.checklist();
    if (!cl) return;
    this.api.patch<any>(`checklists/${cl._id}`, { assigned_to: staffId || null }).subscribe({
      next: () => this.fetchChecklist(),
      error: (err) => alert(err.error?.message || 'Failed to assign checklist.')
    });
  }

  assignDirectorCount(countStr: string) {
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count < 1) {
      alert('Invalid count');
      return;
    }
    const cl = this.checklist();
    if (!cl) return;
    
    const newDetails = { ...cl.details };
    newDetails['assignedNumberOfDirectors'] = count;
    
    this.api.patch<any>(`checklists/${cl._id}`, { details: newDetails }).subscribe({
      next: () => {
        this.fetchChecklist();
        alert('Director count saved successfully!');
      },
      error: (err) => alert(err.error?.message || 'Failed to assign director count.')
    });
  }

  paymentTidToAdd: string = 'Manual Entry';
  paymentOcrVerifiedToAdd: boolean = false;
  paymentTimestampToAdd: string = '';
  isOcrProcessingForPayment = signal<boolean>(false);
  ocrMessageForPayment = signal<string>('');

  openAddPayment() {
    this.paymentAmountToAdd = 0;
    this.paymentTidToAdd = 'Manual Entry';
    this.paymentOcrVerifiedToAdd = false;
    this.paymentTimestampToAdd = new Date().toISOString();
    this.ocrMessageForPayment.set('');
    this.isAddingPayment.set(true);
  }

  cancelAddPayment() {
    this.isAddingPayment.set(false);
  }

  async handlePaymentOcrUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isOcrProcessingForPayment.set(true);
    this.ocrMessageForPayment.set('Processing image...');

    try {
      const details = await this.ocrService.extractPaymentDetails(file, this.systemBankSettings());
      
      if (details.amount) {
        this.paymentAmountToAdd = details.amount;
      }
      
      if (details.transactionId) {
        this.paymentTidToAdd = details.transactionId;
      }

      if (details.paymentTimestamp) {
        this.paymentTimestampToAdd = details.paymentTimestamp;
      }

      this.paymentOcrVerifiedToAdd = details.isVerified;

      if (details.isVerified) {
        this.ocrMessageForPayment.set('Verified: Bank match found!');
      } else {
        this.ocrMessageForPayment.set('Warning: Bank match not found.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      this.ocrMessageForPayment.set('OCR Failed. Please enter manually.');
    } finally {
      this.isOcrProcessingForPayment.set(false);
      // Reset input
      event.target.value = '';
    }
  }

  submitAddPayment() {
    if (!this.paymentAmountToAdd || this.paymentAmountToAdd <= 0) {
       alert("Please enter a valid amount to add.");
       return;
    }

    const requireVerification = this.requirePaymentVerification();
    if ((requireVerification && !this.paymentOcrVerifiedToAdd) || this.isSubmittingPayment()) {
       return;
    }

    this.isSubmittingPayment.set(true);

    const cl = this.checklist();
    if (!cl) return;

    const currentAdvance = Number(cl.advanceAmountPaid) || 0;
    const paymentType = currentAdvance === 0 ? 'advance' : 'installment';

    const logData = {
      paymentType: paymentType,
      amount: this.paymentAmountToAdd,
      transactionId: this.paymentTidToAdd,
      paymentTimestamp: this.paymentTimestampToAdd,
      isVerified: this.paymentOcrVerifiedToAdd
    };

    this.api.post(`checklists/${cl._id}/financial-logs`, logData).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.checklist.set(res.checklist);
        } else {
          this.fetchChecklist();
        }
        this.isAddingPayment.set(false);
        this.isSubmittingPayment.set(false);
      },
      error: (err) => {
         this.isSubmittingPayment.set(false);
         alert(err.error?.message || 'Failed to add payment.');
      }
    });
  }

  startEditNotes() {
    this.editNotesText = this.checklist()?.notes || '';
    this.isEditingNotes.set(true);
  }

  cancelEditNotes() {
    this.isEditingNotes.set(false);
  }

  saveNotes() {
    const cl = this.checklist();
    if (!cl) return;

    this.api.patch<any>(`checklists/${cl._id}`, { notes: this.editNotesText }).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.checklist.set(res.checklist);
        } else {
          this.fetchChecklist();
        }
        this.isEditingNotes.set(false);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update notes.');
        this.isEditingNotes.set(false);
      }
    });
  }

  startEditApplicationId() {
    this.applicationIdInput = this.checklist()?.details?.applicationId || '';
    this.isEditingApplicationId.set(true);
  }

  cancelEditApplicationId() {
    this.isEditingApplicationId.set(false);
  }

  saveApplicationId() {
    const cl = this.checklist();
    if (!cl) return;

    this.isSavingApplicationId.set(true);
    this.api.patch<any>(`checklists/${cl._id}`, { applicationId: this.applicationIdInput }).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.checklist.set(res.checklist);
        } else {
          this.fetchChecklist();
        }
        this.isSavingApplicationId.set(false);
        this.isEditingApplicationId.set(false);
      },
      error: (err) => {
        this.isSavingApplicationId.set(false);
        alert(err.error?.message || 'Failed to update Application ID.');
      }
    });
  }

  getChecklistProgress(): number {
    const cl = this.checklist();
    if (!cl || !cl.items || cl.items.length === 0) return 0;
    const checked = cl.items.filter((i: any) => i.isChecked).length;
    return Math.round((checked / cl.items.length) * 100);
  }

  getServiceSpecificDocuments(): any[] {
    const cl = this.checklist();
    const docs = [];

    if (cl && cl.client_id && cl.client_id.onboarding_documents) {
      const filtered = cl.client_id.onboarding_documents.filter((doc: any) => {
        return doc.name && doc.name.startsWith(cl.service_name);
      });
      docs.push(...filtered);
    }

    if (cl && cl.details) {
      const docArrays = ['dpiitDocs', 'incorpDocs', 'trademarkDocs', 'llpDocs', 'msmeDocs', 'gstDocs', 'isoDocs', 'fssaiDocs', 'dscDocs'];
      for (const key of docArrays) {
        if (cl.details[key] && Array.isArray(cl.details[key])) {
          const formDocs = cl.details[key]
            .filter((d: any) => !d.name.startsWith('Person ')) // Exclude person docs for grouped section
            .map((d: any) => ({
              name: d.name || 'Document',
              fileUrl: d.fileUrl,
              uploadedAt: cl.updatedAt || new Date()
            }));
          docs.push(...formDocs);
        }
      }
    }

    return docs;
  }

  getParsedDirectors(): any[] {
    const cl = this.checklist();
    if (!cl || !cl.details || !cl.details.directors) return [];
    try {
      if (typeof cl.details.directors === 'string') {
        return JSON.parse(cl.details.directors);
      }
      return cl.details.directors;
    } catch (e) {
      console.error('Error parsing directors:', e);
      return [];
    }
  }

  formatLabel(key: any): string {
    if (typeof key !== 'string') return String(key);
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  getGeneralDetails(): { key: string, value: any, rawKey: string }[] {
    const cl = this.checklist();
    if (!cl || !cl.details) return [];
    const entries = [];
    const ignoredKeys = [
      'directors', 'dpiitForm', 'dpiitDocs', 'entityName',
      'incorpDocs', 'llpDocs', 'trademarkDocs', 'msmeDocs', 'gstDocs', 'isoDocs', 'fssaiDocs', 'dscDocs'
    ];
    for (const key of Object.keys(cl.details)) {
      if (ignoredKeys.includes(key)) continue;
      // Skip objects to avoid [object Object] rendering
      if (typeof cl.details[key] === 'object' && cl.details[key] !== null) continue;
      entries.push({ key: this.formatLabel(key), value: cl.details[key], rawKey: key });
    }
    return entries;
  }

  getDirectorDocumentsGrouped(): { title: string, docs: any[] }[] {
    const cl = this.checklist();
    if (!cl) return [];

    const groups: { [key: string]: any[] } = {};

    if (cl.requested_documents) {
      cl.requested_documents.forEach((doc: any) => {
        if (!doc || !doc.name) return;
        const match = doc.name.match(/^director_(\d+)_/i);
        if (match) {
          const title = `Director ${match[1]} Documents`;
          if (!groups[title]) groups[title] = [];
          const niceName = doc.name.replace(new RegExp(`^director_${match[1]}_`, 'i'), '');
          const formattedName = niceName.charAt(0).toUpperCase() + niceName.slice(1);
          groups[title].push({ ...doc, niceName: formattedName });
        }
      });
    }

    if (cl.details) {
      const docArrays = ['incorpDocs', 'llpDocs'];
      for (const key of docArrays) {
        if (cl.details[key] && Array.isArray(cl.details[key])) {
          cl.details[key].forEach((doc: any) => {
            const match = doc.name.match(/^Person (\d+) - (.*)/i);
            if (match) {
              const title = `Director ${match[1]} Documents`;
              if (!groups[title]) groups[title] = [];
              groups[title].push({
                name: doc.name,
                niceName: match[2],
                fileUrl: doc.fileUrl,
                isUploaded: true,
                uploadedAt: cl.updatedAt || new Date()
              });
            }
          });
        }
      }
    }

    return Object.keys(groups).sort().map(title => ({
      title,
      docs: groups[title]
    }));
  }

  getOtherRequestedDocuments(): any[] {
    const cl = this.checklist();
    if (!cl || !cl.requested_documents) return [];

    return cl.requested_documents.filter((doc: any) => {
      return !doc.name.match(/^director_(\d+)_/i);
    });
  }

  updateChecklistStage(stage: string) {
    const cl = this.checklist();
    if (!cl) return;
    this.api.patch(`checklists/${cl._id}`, { stage }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.checklist.set(res.checklist);
        }
      },
      error: (err) => console.error('Error updating stage:', err)
    });
  }

  uploadTemporaryDocument(event: any, item?: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const cl = this.checklist();
    if (!cl) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('documents', files[i]);
    }
    if (item && item.title) {
      formData.append('step_title', item.title);
      formData.append('docName', item.title);
    }

    this.api.post<any>(`checklists/${cl._id}/temporary-documents`, formData).subscribe({
      next: (res) => {
        if (res.success) {
          this.confirmDialog.confirm({
            title: 'Success',
            message: 'Temporary document uploaded successfully!',
            confirmText: 'OK',
            hideCancel: true
          });
          this.fetchChecklist();
        } else {
          alert(res.message || 'Failed to upload documents.');
        }
      },
      error: (err) => {
        console.error('Upload Error:', err);
        alert(err.error?.message || 'Error uploading documents.');
      }
    });
  }

  getTemporaryDocsForStep(item: any): any[] {
    const cl = this.checklist();
    if (!cl || !cl.temporary_documents) return [];
    return cl.temporary_documents.filter((doc: any) => doc.step_title === item.title);
  }

  getGlobalTemporaryDocs(): any[] {
    const cl = this.checklist();
    if (!cl || !cl.temporary_documents) return [];
    return cl.temporary_documents.filter((doc: any) => !doc.step_title);
  }

  isStepDisabled(index: number): boolean {
    const cl = this.checklist();
    if (!cl || !cl.items) return true;
    const item = cl.items[index];
    if (!item) return true;

    if (!this.isFillingStaff() && !this.isAccountManager() && !this.isAdmin()) {
      return true;
    }
    if (this.isActionRequired(cl)) {
      return true;
    }
    if (item.isChecked) {
      return true;
    }
    if (index > 0 && !cl.items[index - 1].isChecked) {
      return true;
    }
    return false;
  }

  customInputValues: { [key: number]: string } = {};

  getCustomInputValue(index: number, defaultValue: string): string {
    if (this.customInputValues[index] !== undefined) {
      return this.customInputValues[index];
    }
    return defaultValue || '';
  }

  onCustomInputChange(index: number, event: any) {
    this.customInputValues[index] = event.target.value;
  }

  saveCustomInputValue(index: number, defaultValue: string) {
    const cl = this.checklist();
    if (!cl) return;
    const value = this.customInputValues[index] !== undefined ? this.customInputValues[index] : defaultValue;
    this.api.patch<any>(`checklists/${cl._id}/items/${index}/value`, { value }).subscribe({
      next: (res) => {
        if (res.success) {
          this.checklist.set(res.checklist);
          delete this.customInputValues[index];
          this.confirmDialog.confirm({
            title: 'Success',
            message: 'Custom input value saved successfully!',
            confirmText: 'OK',
            hideCancel: true
          });
        }
      },
      error: (err) => {
        console.error('Save Custom Value Error:', err);
        alert(err.error?.message || 'Failed to save value.');
      }
    });
  }

  deleteTemporaryDocument(doc: any) {
    const cl = this.checklist();
    if (!cl) return;

    this.confirmDialog.confirm({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete ${doc.name}?`,
      confirmText: 'Delete',
      isDestructive: true
    }).then(confirmed => {
      if (confirmed) {
        this.api.delete<any>(`checklists/${cl._id}/temporary-documents/${doc._id}`).subscribe({
          next: (res) => {
            if (res.success) {
              this.fetchChecklist();
            } else {
              alert(res.message || 'Failed to delete document.');
            }
          },
          error: (err) => {
            console.error('Delete Error:', err);
            alert(err.error?.message || 'Error deleting document.');
          }
        });
      }
    });
  }

  onFinalFilesSelected(event: any) {
    const files = event.target.files;
    const cl = this.checklist();
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.finalDocsToUpload.push({
          file: files[i],
          docType: 'Other'
        });
      }
    }
    event.target.value = '';
  }

  onSpecificFinalFileSelected(event: any, docType: string) {
    const file = event.target.files[0];
    if (file) {
      this.finalDocsToUpload.push({
        file: file,
        docType: docType
      });
    }
    event.target.value = '';
  }

  removeFinalDocFile(index: number) {
    this.finalDocsToUpload.splice(index, 1);
  }

  certIssueDate: string = '';
  certExpiryDate: string = '';
  certNumber: string = '';

  isExpiryService(serviceName: string): boolean {
    if (!serviceName) return false;
    const nameLower = serviceName.toLowerCase();
    return nameLower.includes('dsc') ||
           nameLower.includes('digital signature') ||
           nameLower.includes('fssai') ||
           nameLower.includes('iso') ||
           nameLower.includes('trademark') ||
           nameLower.includes('trade mark') ||
           nameLower.includes('copyright') ||
           nameLower.includes('patent') ||
           nameLower.includes('lei') ||
           nameLower.includes('lie') ||
           nameLower.includes('bis');
  }

  submitFinalDocuments() {
    const cl = this.checklist();
    if (!cl) return;

    if (this.isExpiryService(cl.service_name)) {
      if (!this.certIssueDate || !this.certExpiryDate) {
         alert('Issue Date and Expiry Date are required for this service.');
         return;
      }
    }

    this.isFinalDocUploading = true;
    const formData = new FormData();

    let otherCount = 1;
    for (const doc of this.finalDocsToUpload) {
      let finalName = doc.file.name;
      const ext = doc.file.name.includes('.') ? doc.file.name.substring(doc.file.name.lastIndexOf('.')) : '';
      
      if (doc.docType && doc.docType !== 'Other') {
        finalName = `${doc.docType}${ext}`;
      } else {
        finalName = `${cl.service_name} Final Document ${otherCount}${ext}`;
        otherCount++;
      }
      const newFile = new File([doc.file], finalName, { type: doc.file.type });
      formData.append('final_files', newFile);
    }

    if (this.isExpiryService(cl.service_name)) {
      formData.append('issueDate', this.certIssueDate);
      formData.append('expiryDate', this.certExpiryDate);
      if (this.certNumber) {
        formData.append('certificateNumber', this.certNumber);
      }
    }

    this.api.post(`checklists/${cl._id}/final-documents`, formData).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.checklist.set(res.checklist);
          this.finalDocsToUpload = [];
          this.certIssueDate = '';
          this.certExpiryDate = '';
          this.certNumber = '';
          alert('Final documents uploaded successfully!');
        }
        this.isFinalDocUploading = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to upload final documents.');
        this.isFinalDocUploading = false;
      }
    });
  }

  deleteUploadedFinalDoc(docId: string) {
    if (!confirm('Are you sure you want to delete this final document?')) return;
    const cl = this.checklist();
    if (!cl) return;

    this.api.delete(`checklists/${cl._id}/final-documents/${docId}`).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.checklist.set(res.checklist);
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete final document.');
      }
    });
  }

  isReuploadingMap: Record<string, boolean> = {};

  reuploadFinalDoc(event: any, docId: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm(`Are you sure you want to replace this document with "${file.name}"?`)) {
      event.target.value = '';
      return;
    }

    const cl = this.checklist();
    if (!cl) return;

    this.isReuploadingMap[docId] = true;
    const formData = new FormData();
    formData.append('final_file', file);

    this.api.put(`checklists/${cl._id}/final-documents/${docId}/reupload`, formData).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.checklist.set(res.checklist);
          alert('Document replaced successfully!');
        }
        this.isReuploadingMap[docId] = false;
        event.target.value = '';
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to replace document.');
        this.isReuploadingMap[docId] = false;
        event.target.value = '';
      }
    });
  }

  hasFinalDocUploaded(docType: string): boolean {
    const cl = this.checklist();
    if (!cl || !cl.final_documents) return false;
    return cl.final_documents.some((d: any) => d.name && d.name.startsWith(docType));
  }

  getSortedPrivateLimitedFinalDocs(): string[] {
    const uploaded: string[] = [];
    const pending: string[] = [];
    for (const doc of this.privateLimitedFinalDocs) {
      if (doc === 'Other') continue;
      if (this.hasFinalDocUploaded(doc)) {
        uploaded.push(doc);
      } else {
        pending.push(doc);
      }
    }
    return [...pending, ...uploaded];
  }

  getSortedOpcFinalDocs(): string[] {
    const uploaded: string[] = [];
    const pending: string[] = [];
    for (const doc of this.opcFinalDocs) {
      if (doc === 'Other') continue;
      if (this.hasFinalDocUploaded(doc)) {
        uploaded.push(doc);
      } else {
        pending.push(doc);
      }
    }
    return [...pending, ...uploaded];
  }

  getSortedMsmeFinalDocs(): string[] {
    const uploaded: string[] = [];
    const pending: string[] = [];
    for (const doc of this.msmeFinalDocs) {
      if (doc === 'Other') continue;
      if (this.hasFinalDocUploaded(doc)) {
        uploaded.push(doc);
      } else {
        pending.push(doc);
      }
    }
    return [...pending, ...uploaded];
  }

  // Request Document Modal
  isRequestingDoc = signal<boolean>(false);
  requestDocSuccessMessage = signal<string>('');

  openRequestDocModal() {
    this.newDocRequestName = '';
    this.checklistErrorMessage.set('');
    this.requestDocSuccessMessage.set('');
    this.isRequestDocModalOpen.set(true);
  }

  closeRequestDocModal() {
    this.isRequestDocModalOpen.set(false);
    this.newDocRequestName = '';
  }

  submitRequestDoc() {
    if (!this.newDocRequestName.trim()) {
      this.checklistErrorMessage.set('Document name is required');
      return;
    }

    const cl = this.checklist();
    if (!cl) return;

    this.isRequestingDoc.set(true);
    this.checklistErrorMessage.set('');
    this.requestDocSuccessMessage.set('');

    const requested_documents = cl.requested_documents || [];
    requested_documents.push({
      name: this.newDocRequestName,
      isUploaded: false
    });

    this.api.patch(`checklists/${cl._id}`, {
      requested_documents,
      stage: 'documentRequested'
    }).subscribe({
      next: (res: any) => {
        this.isRequestingDoc.set(false);
        if (res && res.success) {
          this.checklist.set(res.checklist);
          this.requestDocSuccessMessage.set('Document requested successfully!');
          setTimeout(() => {
            this.closeRequestDocModal();
          }, 1500);
        }
      },
      error: (err) => {
        this.isRequestingDoc.set(false);
        this.checklistErrorMessage.set(err.error?.message || 'Error requesting document');
      }
    });
  }

  uploadApplicationReceiptForOCR(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    const formData = new FormData();
    formData.append('document', file);

    this.isScanningApplicationReceipt.set(true);
    
    this.api.post<any>('ocr/extract-application', formData).subscribe({
      next: (response) => {
        this.isScanningApplicationReceipt.set(false);
        input.value = ''; // Reset input
        
        if (response.success && response.data?.applicationId) {
          this.applicationIdInput = response.data.applicationId;
          this.isEditingApplicationId.set(true);
        } else {
          alert('Could not extract Application ID from the provided receipt.');
        }
      },
      error: (err) => {
        this.isScanningApplicationReceipt.set(false);
        input.value = ''; // Reset input
        console.error('OCR Application Extraction Failed:', err);
        alert('OCR processing failed. Please try again or enter manually.');
      }
    });
  }

  // --- Document Verification ---
  orderIdForChat: string | null = null;

  openChatModal() {
    this.isChatModalOpen.set(true);
    
    const cl = this.checklist();
    const companyId = this.user()?.companyId;
    if (!cl || !companyId) {
      this.orderIdForChat = cl?._id || null;
      this.startChatDataFetch();
      return;
    }

    this.isLoadingChat.set(true);
    this.api.get<any>(`orders/company/${companyId}`).subscribe({
      next: (res) => {
        const clientId = cl.client_id?._id || cl.client_id;
        const order = res.orders?.find((o: any) => 
          o.clientUid === clientId && 
          o.serviceType === cl.service_name
        );
        this.orderIdForChat = order ? order._id : cl._id;
        this.startChatDataFetch();
      },
      error: () => {
        this.orderIdForChat = cl._id;
        this.startChatDataFetch();
      }
    });
  }

  startChatDataFetch() {
    this.fetchChatMessages(true);
    this.chatPollingInterval = setInterval(() => {
      this.fetchChatMessages(false);
    }, 5000);
  }

  closeChatModal() {
    this.isChatModalOpen.set(false);
    this.chatMessages.set([]);
    this.newChatMessage = '';
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval);
    }
  }

  fetchChatMessages(showLoading = false) {
    const chatId = this.orderIdForChat;
    if (!chatId) return;

    if (showLoading) this.isLoadingChat.set(true);
    this.api.get<any>(`chat/${chatId}`).subscribe({
      next: (res: any) => {
        if (res && res.messages) {
          const prevCount = this.chatMessages().length;
          this.chatMessages.set(res.messages);
          if (res.messages.length > prevCount || showLoading) {
            this.scrollToBottomChat();
          }
          this.markChatAsSeen(chatId);
        }
        if (showLoading) this.isLoadingChat.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching chat messages:', err);
        if (showLoading) this.isLoadingChat.set(false);
      }
    });
  }

  markChatAsSeen(chatId: string) {
    let userRole = this.user()?.role || 'admin';
    
    this.api.put(`chat/${chatId}/seen`, { viewerRole: userRole }).subscribe({
      next: () => {},
      error: (err) => console.error('Failed to mark as seen', err)
    });
  }

  sendChatMessage() {
    if (!this.newChatMessage.trim()) return;

    const chatId = this.orderIdForChat;
    if (!chatId) return;

    const content = this.newChatMessage.trim();
    this.newChatMessage = ''; // Clear immediately

    let userRole = this.user()?.role || 'admin';

    this.api.post<any>(`chat/${chatId}`, {
      senderId: this.user()?._id || this.user()?.id,
      senderRole: userRole,
      content: content
    }).subscribe({
      next: (res: any) => {
        if (res && res.message) {
          // Optimistically append the message, avoiding duplicates
          this.chatMessages.update(prev => {
            if (prev.some(m => m._id === res.message._id)) return prev;
            return [...prev, res.message];
          });
          this.scrollToBottomChat();
        }
      },
      error: (err: any) => {
        console.error('Error sending chat message:', err);
        alert('Failed to send message');
      }
    });
  }

  showDateDivider(index: number): boolean {
    if (index === 0) return true;
    const currentMsg = this.chatMessages()[index];
    const prevMsg = this.chatMessages()[index - 1];
    if (!currentMsg || !prevMsg) return false;
    
    const currDate = new Date(currentMsg.createdAt);
    const prevDate = new Date(prevMsg.createdAt);
    
    return currDate.toDateString() !== prevDate.toDateString();
  }

  getDateDividerText(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  }

  scrollToBottomChat() {
    setTimeout(() => {
      const containers = document.querySelectorAll('.chat-messages-container');
      containers.forEach(container => {
        // Use smooth scrolling for better UX, and a slightly longer timeout to ensure DOM is updated
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      });
    }, 300);
  }

  formatRole(role: string): string {
    if (!role) return '';
    if (role === 'admin') return 'Manager';
    if (role === 'client_manager') return 'Client Manager';
    if (role === 'filing_staff') return 'Filing Staff';
    if (role === 'staff') return 'Client Support';
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // ─── Generate from Template ───────────────────────────────────────────────

  showGenerateDocModal = signal<boolean>(false);
  availableDocTemplates = signal<any[]>([]);
  selectedDocTemplate = signal<any>(null);
  customInputs = signal<any[]>([]);
  isLoadingDocTemplates = signal<boolean>(false);
  isGeneratingDoc = signal<boolean>(false);
  isEditingTemplate = signal<boolean>(false);
  editorHtml = signal<string>('');
  selectedItemForDocTemplate = signal<any>(null);

  availablePlaceholders = [
    { token: '{{client_name}}', label: 'Client Name' },
    { token: '{{company_name}}', label: 'Company Name' },
    { token: '{{email}}', label: 'Email' },
    { token: '{{phone}}', label: 'Phone' },
    { token: '{{address}}', label: 'Address' },
    { token: '{{pan}}', label: 'PAN' },
    { token: '{{gstin}}', label: 'GSTIN' },
    { token: '{{cin}}', label: 'CIN' },
    { token: '{{tan}}', label: 'TAN' },
    { token: '{{director_count}}', label: 'Director Count' },
    { token: '{{director_name}}', label: 'Director Name(s)' },
    { token: '{{din_number}}', label: 'DIN Number(s)' },
    { token: '{{business_type}}', label: 'Business Type' },
    { token: '{{service_name}}', label: 'Service Name' },
    { token: '{{service_id}}', label: 'Service ID' },
    { token: '{{today_date}}', label: 'Today\'s Date' },
    { token: '{{company_letterhead}}', label: 'Our Company Name' },
    { token: '{{input:Label Name}}', label: 'Custom Input (Modify Label Name)' },
  ];

  openGenerateDocModal() {
    const cl = this.checklist();
    if (!cl) return;
    this.selectedDocTemplate.set(null);
    this.customInputs.set([]);
    this.showGenerateDocModal.set(true);
    this.isLoadingDocTemplates.set(true);
    const encodedService = encodeURIComponent(cl.service_name || '');
    this.api.get<any>(`document-templates/for-service/${encodedService}`).subscribe({
      next: (res) => {
        this.availableDocTemplates.set(res.templates || []);
        this.isLoadingDocTemplates.set(false);
      },
      error: () => {
        this.isLoadingDocTemplates.set(false);
      }
    });
  }

  openGenerateDocModalForTemplate(tmpl: any, item?: any) {
    if (!tmpl) return;
    this.selectedDocTemplate.set(tmpl);
    this.selectedItemForDocTemplate.set(item || null);
    this.customInputs.set([]);
    this.showGenerateDocModal.set(true);
    
    const html = tmpl.html_content || '';
    this.editorHtml.set(html);
    if (html) {
      this.updateCustomInputsFromHtml(html);
    }
  }

  closeGenerateDocModal() {
    this.showGenerateDocModal.set(false);
    this.selectedDocTemplate.set(null);
    this.selectedItemForDocTemplate.set(null);
    this.customInputs.set([]);
    this.isEditingTemplate.set(false);
    this.editorHtml.set('');
  }

  updateCustomInputsFromHtml(html: string) {
    const regex = /\{\{input:([^}]+)\}\}/g;
    const currentInputs = this.customInputs();
    const newInputs: any[] = [];
    let match;
    const seen = new Set();
    
    // First, temporarily clean HTML tags inside brackets to detect them properly
    const cleanHtml = html.replace(/\{\{([\s\S]*?)\}\}/g, (m, p1) => {
      const cleanContent = p1.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      return `{{${cleanContent}}}`;
    });

    while ((match = regex.exec(cleanHtml)) !== null) {
      const fullToken = match[0];
      const label = match[1];
      if (!seen.has(fullToken)) {
        seen.add(fullToken);
        const existing = currentInputs.find(i => i.token === fullToken);
        newInputs.push({ token: fullToken, label: label, value: existing ? existing.value : '' });
      }
    }
    this.customInputs.set(newInputs);
  }

  selectDocTemplate(tmpl: any) {
    this.selectedDocTemplate.set(tmpl);
    const html = tmpl ? (tmpl.html_content || '') : '';
    this.editorHtml.set(html);
    if (html) {
      this.updateCustomInputsFromHtml(html);
    } else {
      this.customInputs.set([]);
    }
  }

  editorUndoStack: string[] = [];
  editorRedoStack: string[] = [];
  lastPushedHtml = '';

  toggleTemplateEditor() {
    const nextState = !this.isEditingTemplate();
    const cl = this.checklist();
    const tmpl = this.selectedDocTemplate();

    if (nextState && cl && tmpl) {
      this.isGeneratingDoc.set(true);
      this.api.post<any>(`document-templates/${tmpl._id}/preview-populated`, { checklist_id: cl._id }).subscribe({
        next: (res) => {
          this.isGeneratingDoc.set(false);
          if (res.success && res.html) {
            this.editorHtml.set(res.html);
            this.editorUndoStack = [res.html];
            this.editorRedoStack = [];
            this.lastPushedHtml = res.html;
            this.isEditingTemplate.set(true);
            setTimeout(() => {
              const el = document.getElementById('generate-template-editor');
              if (el) el.innerHTML = res.html;
            }, 50);
          } else {
            this.editorUndoStack = [this.editorHtml()];
            this.editorRedoStack = [];
            this.lastPushedHtml = this.editorHtml();
            this.isEditingTemplate.set(true);
            setTimeout(() => {
              const el = document.getElementById('generate-template-editor');
              if (el) el.innerHTML = this.editorHtml();
            }, 50);
          }
        },
        error: () => {
          this.isGeneratingDoc.set(false);
          this.editorUndoStack = [this.editorHtml()];
          this.editorRedoStack = [];
          this.lastPushedHtml = this.editorHtml();
          this.isEditingTemplate.set(true);
          setTimeout(() => {
            const el = document.getElementById('generate-template-editor');
            if (el) el.innerHTML = this.editorHtml();
          }, 50);
        }
      });
    } else {
      this.isEditingTemplate.set(nextState);
    }
  }

  getPlaceholderValue(placeholderName: string): string {
    const cl = this.checklist();
    if (!cl) return '';
    const key = placeholderName.trim().toLowerCase();
    
    if (key === 'client name' || key === 'client_name' || key === 'owner_name' || key === 'owner name') {
      return cl.client_id?.owner_name || '';
    }
    if (key === 'company name' || key === 'company_name') {
      return cl.client_id?.company_name || '';
    }
    if (key === 'email' || key === 'client_email' || key === 'client email') {
      return cl.client_id?.email || '';
    }
    if (key === 'client_id' || key === 'client id' || key === 'custom_client_id') {
      return cl.client_id?.custom_client_id || '';
    }
    if (key === 'service_id' || key === 'service id' || key === 'custom_service_id') {
      return cl.custom_service_id || '';
    }
    if (key === 'service_name' || key === 'service name') {
      return cl.service_name || '';
    }
    
    if (cl.details && typeof cl.details === 'object') {
      for (const dk of Object.keys(cl.details)) {
        if (dk.toLowerCase() === key) {
          return cl.details[dk] || '';
        }
      }
      if (cl.details.mcaForm && typeof cl.details.mcaForm === 'object') {
        for (const mk of Object.keys(cl.details.mcaForm)) {
          if (mk.toLowerCase() === key) {
            return cl.details.mcaForm[mk] || '';
          }
        }
      }
    }
    
    return '';
  }

  onEditorKeyDown(event: KeyboardEvent) {
    const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey;
    const isRedo = (event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'));

    if (isUndo) {
      event.preventDefault();
      this.undoEditorChange();
    } else if (isRedo) {
      event.preventDefault();
      this.redoEditorChange();
    } else if (event.key === ' ' || event.key === 'Enter') {
      this.pushEditorState();
    }
  }

  pushEditorState() {
    const el = document.getElementById('generate-template-editor');
    if (el) {
      const html = el.innerHTML;
      if (html !== this.lastPushedHtml) {
        this.editorUndoStack.push(html);
        this.lastPushedHtml = html;
        this.editorRedoStack = [];
      }
    }
  }

  undoEditorChange() {
    if (this.editorUndoStack.length > 1) {
      const current = this.editorUndoStack.pop();
      if (current) this.editorRedoStack.push(current);

      const previous = this.editorUndoStack[this.editorUndoStack.length - 1];
      const el = document.getElementById('generate-template-editor');
      if (el && previous !== undefined) {
        el.innerHTML = previous;
        this.editorHtml.set(previous);
        this.lastPushedHtml = previous;
        this.updateCustomInputsFromHtml(previous);
        this.restoreCursorToEnd(el);
      }
    }
  }

  redoEditorChange() {
    if (this.editorRedoStack.length > 0) {
      const nextState = this.editorRedoStack.pop();
      if (nextState !== undefined) {
        this.editorUndoStack.push(nextState);
        const el = document.getElementById('generate-template-editor');
        if (el) {
          el.innerHTML = nextState;
          this.editorHtml.set(nextState);
          this.lastPushedHtml = nextState;
          this.updateCustomInputsFromHtml(nextState);
          this.restoreCursorToEnd(el);
        }
      }
    }
  }

  restoreCursorToEnd(el: HTMLElement) {
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {}
  }

  onGenerateEditorInput(event: Event) {
    const el = event.target as HTMLElement;
    let html = el.innerHTML;
    const regex = /\{\{([^}]+)\}\}/g;
    let hasReplaced = false;

    html = html.replace(regex, (match, p1) => {
      const val = this.getPlaceholderValue(p1);
      if (val) {
        hasReplaced = true;
        return val;
      }
      return match;
    });

    if (hasReplaced) {
      // Save state before replacing to allow undo
      this.pushEditorState();
      
      el.innerHTML = html;
      this.editorHtml.set(html);
      
      // Update pushed status
      this.lastPushedHtml = html;
      this.editorUndoStack.push(html);
      this.editorRedoStack = [];

      this.restoreCursorToEnd(el);
    } else {
      this.editorHtml.set(html);
      // Auto push to undo stack periodically / simple throttling
      if (html.length % 5 === 0) {
        this.pushEditorState();
      }
    }
    this.updateCustomInputsFromHtml(this.editorHtml());
  }

  generateEditorCmd(command: string) {
    document.execCommand(command, false, '');
    const el = document.getElementById('generate-template-editor');
    if (el) {
      el.focus();
      this.editorHtml.set(el.innerHTML);
      this.updateCustomInputsFromHtml(el.innerHTML);
    }
  }

  generateEditorFontSize(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      document.execCommand('fontSize', false, select.value);
      const el = document.getElementById('generate-template-editor');
      if (el) {
        el.focus();
        this.editorHtml.set(el.innerHTML);
      }
      select.value = "";
    }
  }

  generateEditorFormat(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      document.execCommand('formatBlock', false, select.value);
      const el = document.getElementById('generate-template-editor');
      if (el) {
        el.focus();
        this.editorHtml.set(el.innerHTML);
        this.updateCustomInputsFromHtml(el.innerHTML);
      }
      select.value = "";
    }
  }

  insertPlaceholder(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!select.value) return;

    let token = select.value;
    if (token === 'custom') {
      const name = prompt("Enter custom placeholder label name (e.g. Amount):");
      if (!name) {
        select.value = "";
        return;
      }
      token = `{{input:${name}}}`;
    }

    const el = document.getElementById('generate-template-editor');
    if (el) {
      el.focus();
      document.execCommand('insertText', false, token);
      this.editorHtml.set(el.innerHTML);
      this.updateCustomInputsFromHtml(el.innerHTML);
    }
    select.value = "";
  }

  generateDocumentFromTemplate() {
    const cl = this.checklist();
    const tmpl = this.selectedDocTemplate();
    if (!cl || !tmpl) return;
    this.isGeneratingDoc.set(true);

    const customValues: any = {};
    for (const inp of this.customInputs()) {
      customValues[inp.token] = inp.value || '';
    }

    const payload: any = { 
      checklist_id: cl._id,
      custom_values: customValues
    };
    
    // Always send the latest HTML state if it was modified (or even if it wasn't, as it defaults to the template)
    let currentHtml = this.editorHtml();
    if (this.isEditingTemplate()) {
      const el = document.getElementById('generate-template-editor');
      if (el) currentHtml = el.innerHTML;
    }
    
    if (currentHtml) {
      // Fix broken placeholders by removing HTML tags injected inside the curly braces
      currentHtml = currentHtml.replace(/\{\{([\s\S]*?)\}\}/g, (match, p1) => {
        const cleanContent = p1.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        return `{{${cleanContent}}}`;
      });
      payload.override_html = currentHtml;
    }

    this.api.post<any>(`document-templates/${tmpl._id}/generate`, payload).subscribe({
      next: (res) => {
        this.isGeneratingDoc.set(false);
        if (res.success) {
          // Now add it as a temporary document in the checklist
          const item = this.selectedItemForDocTemplate();
          this.api.post<any>(`checklists/${cl._id}/temporary-documents/from-document`, {
            document_id: res.document._id,
            name: res.document.filename,
            step_title: item ? item.title : null
          }).subscribe({
            next: () => {
              this.closeGenerateDocModal();
              this.fetchChecklist();
               this.confirmDialog.confirm({
                 title: 'Success',
                 message: `✅ "${tmpl.name}" generated and sent to the client!`,
                 confirmText: 'OK',
                 hideCancel: true
               });
            },
            error: (err) => {
              this.isGeneratingDoc.set(false);
              alert(err.error?.message || 'Generated PDF but failed to attach it. Please try again.');
            }
          });
        } else {
          alert(res.message || 'Failed to generate document.');
        }
      },
      error: (err) => {
        this.isGeneratingDoc.set(false);
        alert(err.error?.message || 'Failed to generate document. Please try again.');
      }
    });
  }
}
