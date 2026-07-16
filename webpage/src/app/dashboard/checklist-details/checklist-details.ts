import { Component, OnInit, OnDestroy, signal, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  @Output() onViewOpportunities = new EventEmitter<string>();
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

  isEditingBankDetails = signal<boolean>(false);
  editBankDetailsData = { account_name: '', account_number: '', ifsc_code: '', bank_name: '', branch_name: '' };

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

  // Smart Mentions logic
  showMentionDropdown = false;
  mentionSearch = '';
  
  get currentMentionOptions(): {name: string, role: string, internalRole: string}[] {
    const cl = this.checklist();
    if (!cl) return [];
    
    const opts = [];
    if (cl.created_by?.owner_name) {
      opts.push({ name: cl.created_by.owner_name, role: 'Client Manager', internalRole: 'client_manager' });
    }
    if (cl.assigned_to?.owner_name) {
      opts.push({ name: cl.assigned_to.owner_name, role: 'Filing Staff', internalRole: 'filling_staff' });
    }
    if (cl.client_id?.owner_name) {
      opts.push({ name: cl.client_id.owner_name, role: 'Client', internalRole: 'customer' });
    }
    return opts;
  }
  
  get filteredMentionOptions() {
    const search = this.mentionSearch;
    if (!search) return this.currentMentionOptions;
    return this.currentMentionOptions.filter(o => 
      o.name.toLowerCase().includes(search) || 
      o.role.toLowerCase().includes(search)
    );
  }

  constructor(public api: Api, private ocrService: OcrService, private confirmDialog: ConfirmDialogService, private sanitizer: DomSanitizer) { }

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

  submitForReview() {
    const cl = this.checklist();
    if (!cl) return;
    this.confirmDialog.confirm({
      title: 'Submit for Review',
      message: `Are you sure you want to submit "${cl.service_name}" for manager review? You won't be able to make changes after this.`,
      confirmText: 'Submit for Review',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (!confirmed) return;
      this.api.patch<any>(`checklists/${cl._id}`, { status: 'under_review' }).subscribe({
        next: () => this.fetchChecklist(),
        error: (err) => console.error('Failed to submit for review', err)
      });
    });
  }

  markAsCompleted() {
    const cl = this.checklist();
    if (!cl) return;
    this.confirmDialog.confirm({
      title: 'Mark as Completed',
      message: `Mark "${cl.service_name}" as Completed? This confirms that you have reviewed and approved the work.`,
      confirmText: 'Mark as Completed',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (!confirmed) return;
      this.api.patch<any>(`checklists/${cl._id}`, { status: 'completed' }).subscribe({
        next: () => this.fetchChecklist(),
        error: (err) => console.error('Failed to mark as completed', err)
      });
    });
  }

  rejectChecklist() {
    const cl = this.checklist();
    if (!cl || cl.status !== 'under_review') return;
    this.confirmDialog.confirm({
      title: 'Reject & Re-open',
      message: `Are you sure you want to reject this checklist and re-open it for the filing staff?`,
      confirmText: 'Reject',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (!confirmed) return;
      this.api.patch<any>(`checklists/${cl._id}`, { status: 'reopen' }).subscribe({
        next: () => this.fetchChecklist(),
        error: (err) => console.error('Failed to reject checklist', err)
      });
    });
  }

  isOpportunitiesModalOpen = signal(false);
  opportunitiesClient = signal<any>(null);
  
  recommendationPool = [
    // Incorporation
    { category: 'Incorporation', name: 'Private Limited Incorporation', desc: 'Full-scale incorporation service including name reservation, DSC, DIN, MOA/AOA.' },
    { category: 'Incorporation', name: 'LLP Incorporation', desc: 'Statutory compliance for Limited Liability Partnerships.' },
    { category: 'Incorporation', name: 'OPC', desc: 'One Person Company registration for solo entrepreneurs.' },
    { category: 'Incorporation', name: 'MSME', desc: 'Official Udyam Registration for small and medium enterprises.' },
    { category: 'Incorporation', name: 'Proprietorship', desc: 'Sole vendor formation with business identification.' },
    
    // Compliance
    { category: 'Compliance', name: 'MCA Compliance', desc: 'Annual return filings and MCA statutory compliance.' },
    { category: 'Compliance', name: 'TDS', desc: 'TDS return filing and certificate issuance.' },
    { category: 'Compliance', name: 'PF', desc: 'Provident Fund registration and monthly compliance.' },

    // IP
    { category: 'IP', name: 'Copyright', desc: 'Protection for original creative literary or artistic works.' },
    { category: 'IP', name: 'Trade Mark', desc: 'Brand protection and intellectual property rights.' },
    { category: 'IP', name: 'Patent', desc: 'Exclusive rights for your inventions.' },

    // Tax
    { category: 'Tax', name: 'GST filing', desc: 'Monthly/Quarterly GST returns and reconciliations.' },
    { category: 'Tax', name: 'GST Cancelation', desc: 'Surrender and cancel your GST registration.' },
    { category: 'Tax', name: 'ITR', desc: 'Income Tax Return filing for individuals and businesses.' },
    { category: 'Tax', name: 'GST Registration', desc: 'GST Registration for your business! Thank you for choosing Wealth Empires.' },

    // Licensing
    { category: 'Licensing', name: 'DPIIT', desc: 'Startup India Certification for your startup! Please provide your details correctly.' },
    { category: 'Licensing', name: 'ISO', desc: 'Quality management certification (ISO 9001 and others).' },
    { category: 'Licensing', name: 'FSSAI', desc: 'Registration for food business operators, manufacturers, and startups.' },
    { category: 'Licensing', name: 'DSC', desc: 'Digital Signature Certificate for individuals & organizations.' },
    { category: 'Licensing', name: 'IE code', desc: 'Import Export Code registration for cross-border trade.' },
    { category: 'Licensing', name: 'LEI', desc: 'Legal Entity Identifier registration for financial transactions.' },
    { category: 'Licensing', name: 'BIS', desc: 'Bureau of Indian Standards product certification.' },
    { category: 'Licensing', name: 'RoHS', desc: 'Restriction of Hazardous Substances directive certification.' },
    { category: 'Licensing', name: 'CE', desc: 'European standard certifications for electronics and products.' },
    
    // Fallback original pool ones just in case naming was different
    { category: 'Compliance', name: 'ISO Certification', desc: 'Quality management system certification' },
    { category: 'Compliance', name: 'FSSAI Registration', desc: 'Food safety and standards registration' }
  ];

  viewOpportunitiesForClient() {
    const cl = this.checklist();
    if (!cl) return;
    const clientId = cl.client_id?._id || cl.client_id;
    if (clientId) {
      this.api.get<any>('users/clients').subscribe({
        next: (res) => {
          if (res && res.clients) {
            let clientData = res.clients.find((c: any) => c._id === clientId);
            if (clientData) {
              clientData.opportunities = this.generateOpportunitiesForClient(clientData);
              clientData.alreadyDone = this.getAlreadyDoneServices(clientData);
              this.opportunitiesClient.set(clientData);
              this.isOpportunitiesModalOpen.set(true);
            }
          }
        },
        error: (err) => console.error('Error fetching client for opportunities', err)
      });
    }
  }

  generateOpportunitiesForClient(client: any) {
    const weDone = (client.we_services || []).filter((s: any) => s.status === 'completed' || s.status === 'complete' || s.stage === 'completed').map((s: any) => s.serviceName);
    const outsourced = (client.outsourced_services || []).map((s: any) => s.serviceName);
    const doneSet = new Set([...weDone, ...outsourced]);
    
    const primaryIncorpServices = ['Private Limited Incorporation', 'LLP Incorporation', 'OPC', 'Proprietorship'];
    const hasPrimaryIncorp = primaryIncorpServices.some(s => doneSet.has(s));

    return this.recommendationPool.filter(s => {
      if (doneSet.has(s.name)) return false;
      
      // Do not suggest other entity incorporation types if one is already completed
      if (hasPrimaryIncorp && primaryIncorpServices.includes(s.name)) {
        return false;
      }
      
      return true;
    });
  }

  getAlreadyDoneServices(client: any) {
    const weDone = (client.we_services || []).filter((s: any) => s.status === 'completed' || s.status === 'complete' || s.stage === 'completed').map((s: any) => ({ name: s.serviceName, source: 'WE', checklistId: s.checklistId }));
    const outsourced = (client.outsourced_services || []).map((s: any) => ({ name: s.serviceName, source: 'Outsourced' }));
    return [...weDone, ...outsourced];
  }
  
  getWeDone(client: any) {
    return (client.alreadyDone || []).filter((d: any) => d.source === 'WE');
  }

  getOutsourcedDone(client: any) {
    return (client.alreadyDone || []).filter((d: any) => d.source === 'Outsourced');
  }

  radarAmount = signal<number | null>(null);

  enableComplianceRadar() {
    const amount = this.radarAmount();
    if (!amount || amount < 15000) return;

    const client = this.opportunitiesClient();
    if (!client) return;
    const clientId = client._id;

    // 1. Update the client profile to enable radar
    this.api.patch<any>(`users/clients/${clientId}/compliance-radar`, {
      in_compliance_radar: true
    }).subscribe({
      next: (res) => {
        if (res.success || res.message) {
          // 2. Generate a ServiceOrder silently for financial analytics
          const orderPayload = {
            cleintUid: clientId,
            entityName: client.company_name || client.owner_name || 'Individual',
            serviceType: "Compliance Radar",
            companyName: client.company_name || client.owner_name,
            status: "complete",
            stage: "completed",
            dealClosedAmount: amount,
            advanceAmountPaid: amount
          };
          this.api.post<any>('orders', orderPayload).subscribe({
            next: () => {
              this.opportunitiesClient.update((c: any) => ({ ...c, in_compliance_radar: true }));
              this.radarAmount.set(null);
            },
            error: (err) => console.error('Radar enabled, but failed to log order: ', err)
          });
        }
      },
      error: (err) => alert('Failed to enable Compliance Radar: ' + (err.message || 'Unknown error'))
    });
  }

  markAsOutsourced(client: any, opportunity: any) {
    this.api.post<any>(`users/clients/${client._id}/outsource-service`, { serviceName: opportunity.name }).subscribe({
      next: (res) => {
        if(res.success) {
          const updatedClient = { ...client, outsourced_services: res.outsourced_services };
          updatedClient.opportunities = this.generateOpportunitiesForClient(updatedClient);
          updatedClient.alreadyDone = this.getAlreadyDoneServices(updatedClient);
          this.opportunitiesClient.set(updatedClient);
        }
      },
      error: (err) => {
        console.error('Error marking as outsourced', err);
        alert(err.error?.message || err.message || 'Error marking as outsourced');
      }
    });
  }

  applyWithWE(client: any, opportunity: any) {
    if (confirm(`Navigate to ${client.name || client.company_name}'s dashboard to apply for ${opportunity.name}?`)) {
      window.location.href = `/dashboard/client/${client._id}`;
    }
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
      'dpiit', 'duns', 'private limited', 'trade mark', 'trademark', 'copyright', 'llp', 'msme', 'gst', 'iso', 'fssai', 
      'one person company', 'opc', 'lei', 'lie', 'bis', 'mca', 'dsc', 'iec', 'proprietorship', 'tds', 'pan, tan', 'itr', 'pf', 'patent', 'ce', 'rohs'
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
    const id = this.checklistId();
    if (!id) return;
    this.api.get<any>(`checklists/${id}`).subscribe({
      next: (res) => {
        if (res && res.success && res.checklist) {
          this.checklist.set(res.checklist);
          if (this.autoOpenChat() && !this.isChatModalOpen() && !this._chatOpenedLocally) {
            this._chatOpenedLocally = true;
            this.openChatModal();
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
    if (currentItem.getBill && !(currentItem.expenses?.length > 0 || currentItem.expense?.billUrl)) {
      this.confirmDialog.confirm({
        title: 'Action Required',
        message: 'You must upload the bill before completing this step.',
        confirmText: 'OK',
        hideCancel: true
      });
      revertCheckbox();
      return;
    }

    const stepDocs = this.getTemporaryDocsForStep(currentItem);
    const hasPendingDoc = stepDocs.some(doc => doc.status !== 'replied');
    if (hasPendingDoc) {
      this.confirmDialog.confirm({
        title: 'Client Signature Pending',
        message: 'A document for this step is pending client signature. You can complete this step once the client signs or replies.',
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
      message: (itemIndex === cl.items.length - 1) ? 
               'Are you sure you want to complete this final step? Doing so will automatically submit this service for manager review.' : 
               'Are you sure you want to complete this step? This cannot be undone.',
      confirmText: 'Yes, Complete',
      cancelText: 'Cancel',
      autoCancelSeconds: 6
    }).then((confirmed) => {
      if (confirmed) {
        let resolution_note = '';
        if (isSupportItem) {
          const note = prompt('Please enter a description/resolution for closing this support ticket:');
          if (note === null) {
            // User cancelled the prompt
            revertCheckbox();
            return;
          }
          if (!note.trim()) {
            alert('A description is required to close a support ticket.');
            revertCheckbox();
            return;
          }
          resolution_note = note.trim();
        }

        const payload = resolution_note ? { resolution_note } : {};

        this.api.patch<any>(`checklists/${cl._id}/items/${itemIndex}`, payload).subscribe({
          next: () => {
            if (itemIndex === cl.items.length - 1) {
              this.api.patch<any>(`checklists/${cl._id}`, { status: 'under_review' }).subscribe({
                next: () => this.fetchChecklist(),
                error: (err) => {
                  console.error('Failed to auto-submit for review', err);
                  this.fetchChecklist();
                }
              });
            } else {
              this.fetchChecklist();
            }
          },
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

  isIncorporationService(): boolean {
    const serviceNameLower = (this.checklist()?.service_name || '').toLowerCase();
    const incorpServices = ['incorporation', 'private limited', 'opc', 'one person company', 'llp', 'proprietorship'];
    return incorpServices.some(s => serviceNameLower.includes(s));
  }

  startEditBankDetails() {
    const cl = this.checklist();
    const bd = cl?.bank_details || {};
    this.editBankDetailsData = {
      account_name: bd.account_name || '',
      account_number: bd.account_number || '',
      ifsc_code: bd.ifsc_code || '',
      bank_name: bd.bank_name || '',
      branch_name: bd.branch_name || ''
    };
    this.isEditingBankDetails.set(true);
  }

  cancelEditBankDetails() {
    this.isEditingBankDetails.set(false);
  }

  saveBankDetails() {
    const cl = this.checklist();
    if (!cl) return;

    this.api.patch<any>(`checklists/${cl._id}`, { bank_details: this.editBankDetailsData }).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.checklist.set(res.checklist);
        } else {
          this.fetchChecklist();
        }
        this.isEditingBankDetails.set(false);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update bank details.');
        this.isEditingBankDetails.set(false);
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
      const docArrays = ['dunsDocs', 'dpiitDocs', 'incorpDocs', 'trademarkDocs', 'llpDocs', 'msmeDocs', 'gstDocs', 'isoDocs', 'fssaiDocs', 'dscDocs'];
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

  copyToClipboard(text: string, event: Event) {
    event.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  getDirectorContact(director: any, type: 'phone' | 'email'): string {
    if (!director) return '';
    for (const key of Object.keys(director)) {
      const lower = String(key).toLowerCase();
      if (lower.includes(type) && director[key]) {
        return String(director[key]);
      }
    }
    return '';
  }

  getGeneralDetails(): { key: string, value: any, rawKey: string }[] {
    const cl = this.checklist();
    if (!cl || !cl.details) return [];
    const entries = [];
    const ignoredKeys = [
      'directors', 'dunsForm', 'dunsDocs', 'dpiitForm', 'dpiitDocs', 'entityName',
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

    const stepDocs = this.getTemporaryDocsForStep(item);
    const hasPendingDoc = stepDocs.some(doc => doc.status !== 'replied');
    if (hasPendingDoc) {
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

  isDocItemChecked(doc: any): boolean {
    const cl = this.checklist();
    if (!cl || !cl.items || !doc.checklist_item_id) return false;
    const item = cl.items.find((i: any) => i._id === doc.checklist_item_id);
    return item ? !!item.isChecked : false;
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

  openRequestDocForStep(item: any) {
    this.newDocRequestName = item.title || '';
    this.checklistErrorMessage.set('');
    this.requestDocSuccessMessage.set('');
    this.isRequestDocModalOpen.set(true);
  }

  getAllRequestedDocsForStep(item: any) {
    const cl = this.checklist();
    if (!cl || !cl.requested_documents) return [];
    const itemTitle = (item.title || '').trim().toLowerCase();
    return cl.requested_documents.filter((doc: any) => 
      (doc.name || '').trim().toLowerCase().includes(itemTitle) || 
      itemTitle.includes((doc.name || '').trim().toLowerCase())
    );
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

  extractMentions(message: string): string[] {
    const mentions: string[] = [];
    const lower = message.toLowerCase();
    for (const opt of this.currentMentionOptions) {
      if (lower.includes('@' + opt.name.toLowerCase())) {
        if (!mentions.includes(opt.internalRole)) mentions.push(opt.internalRole);
      }
    }
    if (lower.includes('@admin')) mentions.push('admin');
    return mentions;
  }

  onChatInput(event: any) {
    const val = event.target.value;
    const cursor = event.target.selectionStart;
    const valBeforeCursor = val.substring(0, cursor);
    const lastAtIdx = valBeforeCursor.lastIndexOf('@');
    
    if (lastAtIdx !== -1) {
      const search = valBeforeCursor.substring(lastAtIdx + 1);
      if (!search.includes(' ')) {
        this.showMentionDropdown = true;
        this.mentionSearch = search.toLowerCase();
        return;
      }
    }
    this.showMentionDropdown = false;
  }

  onChatKeydown(event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      const val = input.value;
      const cursor = input.selectionStart;
      if (cursor === null) return;
      
      const beforeCursor = val.substring(0, cursor);
      for (const opt of this.currentMentionOptions) {
        const mentionStr = '@' + opt.name + ' ';
        if (beforeCursor.endsWith(mentionStr)) {
          event.preventDefault();
          const newVal = beforeCursor.slice(0, -mentionStr.length) + val.substring(cursor);
          this.newChatMessage = newVal;
          setTimeout(() => { input.selectionStart = input.selectionEnd = cursor - mentionStr.length; }, 0);
          this.showMentionDropdown = false;
          return;
        }
        const mentionStrNoSpace = '@' + opt.name;
        if (beforeCursor.endsWith(mentionStrNoSpace)) {
          event.preventDefault();
          const newVal = beforeCursor.slice(0, -mentionStrNoSpace.length) + val.substring(cursor);
          this.newChatMessage = newVal;
          setTimeout(() => { input.selectionStart = input.selectionEnd = cursor - mentionStrNoSpace.length; }, 0);
          this.showMentionDropdown = false;
          return;
        }
      }
    }
  }

  insertMention(opt: any, event?: Event) {
    if (event) event.preventDefault();
    const inputEl = document.querySelector('.chat-input-area input') as HTMLInputElement;
    const val = this.newChatMessage;
    const cursor = inputEl ? inputEl.selectionStart : val.length;
    
    const beforeCursor = val.substring(0, cursor!);
    const lastAtIdx = beforeCursor.lastIndexOf('@');
    
    if (lastAtIdx !== -1) {
      const before = val.substring(0, lastAtIdx);
      const after = val.substring(cursor!);
      const mentionStr = '@' + opt.name + ' ';
      this.newChatMessage = before + mentionStr + after;
      
      if (inputEl) {
        setTimeout(() => {
          inputEl.focus();
          inputEl.selectionStart = inputEl.selectionEnd = before.length + mentionStr.length;
        }, 0);
      }
    }
    this.showMentionDropdown = false;
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
      mentions: this.extractMentions(content),
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
    const currentInputs = this.customInputs();
    const newInputs: any[] = [];
    const seen = new Set();
    
    // Clean HTML tags inside brackets
    const cleanHtml = html.replace(/\{\{([\s\S]*?)\}\}/g, (m: string, p1: string) => {
      const cleanContent = p1.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      return `{{${cleanContent}}}`;
    });

    // Find any pattern like {{something}}
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = regex.exec(cleanHtml)) !== null) {
      const fullToken = match[0];
      let rawLabel = match[1].trim();
      
      let label = rawLabel;
      if (rawLabel.startsWith('input:')) {
        label = rawLabel.substring(6).trim();
      }

      if (!seen.has(fullToken)) {
        seen.add(fullToken);
        const existing = currentInputs.find(i => i.token === fullToken);
        
        let defaultValue = '';
        if (existing) {
          defaultValue = existing.value;
        } else {
          const cl = this.checklist();
          const det = cl?.details || {};

          // Universal detail lookup — tries all known key variants for each field
          const getDetail = (...keys: string[]) => {
            for (const k of keys) {
              const v = det[k];
              if (v && typeof v === 'string' && v.trim()) return v.trim();
            }
            return '';
          };

          const clientName = getDetail('ownerName', 'owner_name', 'Applicant Name', 'applicantName', 'fullName', 'name')
            || cl?.client_id?.owner_name || cl?.client_id?.name || '';
          const clientEmail = getDetail('companyEmail', 'email', 'Applicant Email', 'applicantEmail')
            || cl?.client_id?.email || '';
          const clientPhone = getDetail('companyPhone', 'phone', 'Applicant Phone', 'applicantPhone')
            || cl?.client_id?.phone || '';
          const companyName = getDetail('companyName', 'company_name', 'entityName', 'entity_name', 'Entity Name', 'Company Name')
            || cl?.client_id?.company_name || '';
          const address = getDetail('address', 'Address', 'Company Address', 'registeredAddress')
            || cl?.client_id?.address || '';
          const pan = getDetail('pan', 'PAN', 'Company PAN', 'companyPan')
            || cl?.client_id?.pan || '';
          const gstin = getDetail('gstin', 'GSTIN', 'GST Number', 'gstNumber')
            || cl?.client_id?.gstin || '';
          const cin = getDetail('cin', 'CIN', 'CIN Number')
            || cl?.client_id?.cin || '';
          const tan = getDetail('tan', 'TAN', 'TAN Number')
            || cl?.client_id?.tan || '';
          const serviceName = cl?.service_name || '';
          const serviceId = cl?.custom_service_id || cl?._id || '';
          const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

          // Parse directors list if present in cl.details
          let directorsList: any[] = [];
          if (cl?.details && typeof cl.details === 'object') {
            const rawDirs = cl.details.directors || cl.details.partners || cl.details.members;
            if (rawDirs) {
              try {
                if (typeof rawDirs === 'string') {
                  directorsList = JSON.parse(rawDirs);
                } else if (Array.isArray(rawDirs)) {
                  directorsList = rawDirs;
                }
              } catch (e) {
                console.error("Failed to parse directors:", e);
              }
            }
          }

          // Extract first director/partner name from cl.details dynamically as fallback
          let directorNameVal = '';
          if (directorsList && directorsList.length > 0) {
            directorNameVal = directorsList[0]?.fullName || directorsList[0]?.name || '';
          }
          if (!directorNameVal && cl?.details && typeof cl.details === 'object') {
            const keys = Object.keys(cl.details);
            const directorKey = keys.find(k => {
              const kl = k.toLowerCase();
              return kl.includes('director') && (kl.includes('name') || kl.includes('1') || kl.includes('first'));
            }) || keys.find(k => {
              const kl = k.toLowerCase();
              return kl.includes('partner') && (kl.includes('name') || kl.includes('1') || kl.includes('first'));
            }) || keys.find(k => {
              const kl = k.toLowerCase();
              return kl.includes('director') || kl.includes('partner');
            });
            
            if (directorKey) {
              directorNameVal = cl.details[directorKey] || '';
            }
          }

          const tokenLower = rawLabel.toLowerCase().replace(/[^a-z0-9_:]/g, '');
          if (tokenLower === 'client_name' || tokenLower === 'clientname') {
            defaultValue = clientName;
          } else if (tokenLower === 'company_name' || tokenLower === 'companyname') {
            defaultValue = companyName;
          } else if (tokenLower === 'email') {
            defaultValue = clientEmail;
          } else if (tokenLower === 'phone') {
            defaultValue = clientPhone;
          } else if (tokenLower === 'address') {
            defaultValue = cl?.client_id?.address || cl?.details?.address || cl?.details?.['Company Address'] || cl?.details?.['Address'] || '';
          } else if (tokenLower === 'pan') {
            defaultValue = cl?.details?.pan || cl?.details?.['PAN'] || cl?.details?.['Company PAN'] || cl?.client_id?.pan || '';
          } else if (tokenLower === 'gstin') {
            defaultValue = cl?.details?.gstin || cl?.details?.['GSTIN'] || cl?.details?.['GST Number'] || cl?.client_id?.gstin || '';
          } else if (tokenLower === 'cin') {
            defaultValue = cl?.details?.cin || cl?.details?.['CIN'] || cl?.details?.['CIN Number'] || cl?.client_id?.cin || '';
          } else if (tokenLower === 'tan') {
            defaultValue = cl?.details?.tan || cl?.details?.['TAN'] || cl?.details?.['TAN Number'] || cl?.client_id?.tan || '';
          } else if (tokenLower === 'director_count' || tokenLower === 'directorcount') {
            defaultValue = cl?.details?.director_count || (directorsList && directorsList.length > 0 ? String(directorsList.length) : '') || cl?.details?.['Director Count'] || cl?.details?.['No of Directors'] || '';
          } else if (tokenLower === 'director_name' || tokenLower === 'directorname') {
            defaultValue = directorNameVal || clientName;
          } else if (tokenLower === 'din_number' || tokenLower === 'dinnumber' || tokenLower === 'din') {
            defaultValue = cl?.details?.din_number || (directorsList && directorsList.length > 0 ? directorsList.map(d => d.din).filter(Boolean).join(', ') : '') || cl?.details?.['DIN Number'] || cl?.details?.['DIN'] || '';
          } else if (tokenLower === 'business_type' || tokenLower === 'businesstype') {
            defaultValue = cl?.details?.business_type || cl?.details?.['Business Type'] || cl?.details?.['Entity Type'] || '';
          } else if (tokenLower === 'service_name' || tokenLower === 'servicename') {
            defaultValue = serviceName;
          } else if (tokenLower === 'service_id' || tokenLower === 'serviceid') {
            defaultValue = serviceId;
          } else if (tokenLower === 'today_date' || tokenLower === 'todaydate') {
            defaultValue = today;
          } else if (tokenLower === 'company_letterhead' || tokenLower === 'companyletterhead') {
            defaultValue = 'Wealth Empires';
          } else if (tokenLower.includes('director') || tokenLower.includes('partner') || tokenLower.includes('proprietor') || tokenLower.includes('member')) {
            const numberMatch = tokenLower.match(/\d+/);
            const numStr = numberMatch ? numberMatch[0] : '';
            const idx = numStr ? parseInt(numStr, 10) - 1 : 0;
            
            // Try parsed directorsList first
            if (directorsList && directorsList[idx]) {
              const d = directorsList[idx];
              const isDin = tokenLower.includes('din');
              const isPan = tokenLower.includes('pan');
              const isName = tokenLower.includes('name') || (!isDin && !isPan);
              
              if (isDin) defaultValue = d.din || d.dinNumber || '';
              else if (isPan) defaultValue = d.pan || d.panNumber || '';
              else if (isName) defaultValue = d.fullName || d.name || d.owner_name || '';
            }

            // Fallback to flat detail keys
            if (!defaultValue && cl?.details && typeof cl.details === 'object') {
              const keys = Object.keys(cl.details);
              let matchedKey = '';
              
              if (numStr) {
                const isDin = tokenLower.includes('din');
                const isPan = tokenLower.includes('pan');
                const isName = tokenLower.includes('name');
                
                matchedKey = keys.find(k => {
                  const kl = k.toLowerCase();
                  const hasNum = kl.includes(numStr) || (numStr === '1' && kl.includes('first')) || (numStr === '2' && kl.includes('second')) || (numStr === '3' && kl.includes('third'));
                  const isRole = kl.includes('director') || kl.includes('partner') || kl.includes('proprietor');
                  if (!hasNum || !isRole) return false;
                  
                  if (isDin && (kl.includes('din') || kl.includes('identification'))) return true;
                  if (isPan && kl.includes('pan')) return true;
                  if (isName && kl.includes('name')) return true;
                  return false;
                }) || '';
              }
              
              if (!matchedKey) {
                matchedKey = keys.find(k => {
                  const kl = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const tl = tokenLower.replace(/[^a-z0-9]/g, '');
                  return kl.includes(tl) || tl.includes(kl);
                }) || '';
              }
              
              if (matchedKey) {
                defaultValue = cl.details[matchedKey] || '';
              }
            }
            
            if (!defaultValue) {
              if (!numStr) {
                defaultValue = directorNameVal || clientName;
              } else if (numStr === '1') {
                defaultValue = directorNameVal;
              } else {
                defaultValue = '';
              }
            }
          }
        }

        newInputs.push({ 
          token: fullToken, 
          label: label, 
          value: defaultValue 
        });
      }
    }
    this.customInputs.set(newInputs);
  }

  getLivePreviewContent(): SafeHtml {
    const tmpl = this.selectedDocTemplate();
    if (!tmpl) return '';
    
    let html = tmpl.html_content || '';
    
    html = html.replace(/\{\{([\s\S]*?)\}\}/g, (m: string, p1: string) => {
      const cleanContent = p1.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      return `{{${cleanContent}}}`;
    });

    for (const inp of this.customInputs()) {
      const val = inp.value || `<span style="color: #ef4444; font-weight: bold; background: #fee2e2; padding: 2px 4px; border-radius: 4px;">[${inp.label}]</span>`;
      html = html.split(inp.token).join(val);
    }
    
    return this.sanitizer.bypassSecurityTrustHtml(html);
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
    
    let compiledHtml = tmpl.html_content || '';
    
    // Fix broken placeholders by removing HTML tags injected inside the curly braces
    compiledHtml = compiledHtml.replace(/\{\{([\s\S]*?)\}\}/g, (match: string, p1: string) => {
      const cleanContent = p1.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      return `{{${cleanContent}}}`;
    });
    
    // Substitute all placeholders with their current values
    for (const inp of this.customInputs()) {
      const val = inp.value || '';
      compiledHtml = compiledHtml.split(inp.token).join(val);
    }
    
    payload.override_html = compiledHtml;

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
