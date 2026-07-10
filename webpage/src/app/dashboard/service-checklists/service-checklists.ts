import { Component, OnInit, OnDestroy, signal, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-service-checklists',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './service-checklists.html',
  styleUrl: './service-checklists.css'
})
export class ServiceChecklists implements OnInit, OnDestroy {
  @Output() onViewChecklist = new EventEmitter<string>();
  user = signal<any>(null);
  checklists = signal<any[]>([]);
  teams = input<any[]>([]);
  clients = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  pollInterval: any;

  // Directory State
  currentDirectoryTab = signal<string>('pending');
  searchQuery = signal<string>('');

  // Checklist creation/edit State
  isCreateChecklistModalOpen = signal<boolean>(false);
  isAddChecklistItemModalOpen = signal<boolean>(false);
  selectedChecklistId: string = '';
  newChecklistItemTitle: string = '';
  newChecklistItemDesc: string = '';
  checklistErrorMessage = signal<string>('');
  checklistSuccessMessage = signal<string>('');
  newChecklist = {
    client_id: '',
    service_name: '',
    assigned_to: '',
    notes: '',
    items: [] as { title: string, description: string }[]
  };
  newChecklistNewItemTitle = '';
  newChecklistNewItemDesc = '';

  availableServices = [
    'Private Limited Incorporation',
    'LLP Incorporation',
    'OPC',
    'MSME',
    'Proprietorship',
    'MCA Compliance',
    'TDS',
    'PF',
    'Copyright',
    'GST Compliance',
    'GST Cancelation',
    'GST filing',
    'ITR',
    'DPIIT', 'DUNS',
    'Trade Mark',
    'GST Registration',
    'ISO',
    'Patent',
    'FSSAI',
    'DSC',
    'IE code',
    'LEI',
    'BIS',
    'ROSH & CE'
  ];

  constructor(public api: Api) { }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchChecklists();
    this.fetchClients();

    // Poll for changes so admin updates reflect immediately for staff
    this.pollInterval = setInterval(() => {
      this.fetchChecklists();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  getCompanyId(): string | null {
    const u = this.user();
    if (!u) return null;
    if (u.company_id && typeof u.company_id === 'object') {
      return u.company_id._id || null;
    }
    return u.company_id || null;
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

  fetchChecklists() {
    this.api.get<any>('checklists').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.checklists.set(res.checklists);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch checklists:', err);
        this.isLoading.set(false);
      }
    });
  }

  hasPendingPayment(c: any): boolean {
    const dealClosed = c.dealClosedAmount || 0;
    const paid = c.advanceAmountPaid || 0;
    return dealClosed > paid;
  }

  getPendingPaymentAmount(c: any): number {
    const dealClosed = c.dealClosedAmount || 0;
    const paid = c.advanceAmountPaid || 0;
    return Math.max(0, dealClosed - paid);
  }

  filteredChecklists() {
    const all = this.checklists();
    const tab = this.currentDirectoryTab();
    const query = this.searchQuery().toLowerCase().trim();

    let filtered = all;
    if (tab === 'pending') {
      filtered = all.filter(c => {
        return this.isActionRequired(c) && c.status !== 'completed';
      });
    } else if (tab === 'in_progress') {
      filtered = all.filter(c => this.getChecklistDisplayStatus(c) === 'In Progress');
    } else if (tab === 'completed') {
      filtered = all.filter(c => this.getChecklistDisplayStatus(c) === 'Completed' && this.hasPendingPayment(c));
    } else if (tab === 'final_delivered') {
      filtered = all.filter(c => this.getChecklistDisplayStatus(c) === 'Completed' && !this.hasPendingPayment(c));
    }

    if (query) {
      filtered = filtered.filter(c => {
        const clientName = (c.client_id?.owner_name || '').toLowerCase();
        const clientCompany = (c.client_id?.company_name || '').toLowerCase();
        const serviceName = (c.service_name || '').toLowerCase();
        return clientName.includes(query) || clientCompany.includes(query) || serviceName.includes(query);
      });
    }

    return filtered;
  }

  currentPage = signal<number>(1);
  itemsPerPage = 15;

  paginatedChecklists() {
    const filtered = this.filteredChecklists();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  totalPages() {
    return Math.max(1, Math.ceil(this.filteredChecklists().length / this.itemsPerPage));
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  getTabCount(tab: string): number {
    const all = this.checklists();
    if (tab === 'all') return all.length;
    if (tab === 'pending') {
      return all.filter(c => this.isActionRequired(c) && c.status !== 'completed').length;
    } else if (tab === 'in_progress') {
      return all.filter(c => this.getChecklistDisplayStatus(c) === 'In Progress').length;
    } else if (tab === 'completed') {
      return all.filter(c => this.getChecklistDisplayStatus(c) === 'Completed' && this.hasPendingPayment(c)).length;
    } else if (tab === 'final_delivered') {
      return all.filter(c => this.getChecklistDisplayStatus(c) === 'Completed' && !this.hasPendingPayment(c)).length;
    }
    return 0;
  }

  fetchClients() {
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          this.clients.set(res.clients);
        }
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

  viewDetails(id: string) {
    this.onViewChecklist.emit(id);
  }

  openCreateChecklistModal() {
    this.newChecklist = { client_id: '', service_name: '', assigned_to: '', notes: '', items: [] };
    this.newChecklistNewItemTitle = '';
    this.newChecklistNewItemDesc = '';
    this.checklistErrorMessage.set('');
    this.checklistSuccessMessage.set('');
    this.isCreateChecklistModalOpen.set(true);
  }

  closeCreateChecklistModal() {
    this.isCreateChecklistModalOpen.set(false);
  }

  addItemToNewChecklist() {
    const title = this.newChecklistNewItemTitle.trim();
    if (title) {
      this.newChecklist.items.push({
        title,
        description: this.newChecklistNewItemDesc.trim()
      });
      this.newChecklistNewItemTitle = '';
      this.newChecklistNewItemDesc = '';
    }
  }

  removeNewChecklistItem(idx: number) {
    this.newChecklist.items.splice(idx, 1);
  }

  submitCreateChecklist() {
    this.checklistErrorMessage.set('');
    this.checklistSuccessMessage.set('');
    if (!this.newChecklist.client_id || !this.newChecklist.service_name) {
      this.checklistErrorMessage.set('Client and service name are required.');
      return;
    }
    const payload = {
      client_id: this.newChecklist.client_id,
      service_name: this.newChecklist.service_name,
      assigned_to: this.newChecklist.assigned_to || null,
      notes: this.newChecklist.notes,
      items: JSON.stringify(this.newChecklist.items)
    };
    this.api.post<any>('checklists', payload).subscribe({
      next: (res) => {
        this.checklistSuccessMessage.set('Checklist created successfully!');
        this.fetchChecklists();
        setTimeout(() => this.closeCreateChecklistModal(), 1200);
      },
      error: (err) => {
        this.checklistErrorMessage.set(err.error?.message || 'Failed to create checklist.');
      }
    });
  }

  toggleChecklistItem(checklistId: string, itemIndex: number) {
    const cl = this.checklists().find((c: any) => c._id === checklistId);
    if (cl && itemIndex === cl.items.length - 1 && !cl.items[itemIndex].isChecked) {
      if (!cl.final_documents || cl.final_documents.length === 0) {
        alert('Please upload the final document(s) before completing the final step.');
        return;
      }
    }
    this.api.patch<any>(`checklists/${checklistId}/items/${itemIndex}`, {}).subscribe({
      next: (res) => {
        this.fetchChecklists();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update checklist item.');
      }
    });
  }

  openAddChecklistItemModal(checklistId: string) {
    this.selectedChecklistId = checklistId;
    this.newChecklistItemTitle = '';
    this.newChecklistItemDesc = '';
    this.isAddChecklistItemModalOpen.set(true);
  }

  closeAddChecklistItemModal() {
    this.isAddChecklistItemModalOpen.set(false);
  }

  submitAddChecklistItem() {
    if (!this.newChecklistItemTitle.trim()) return;
    this.api.post<any>(`checklists/${this.selectedChecklistId}/items`, {
      title: this.newChecklistItemTitle,
      description: this.newChecklistItemDesc
    }).subscribe({
      next: (res) => {
        this.fetchChecklists();
        this.closeAddChecklistItemModal();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add checklist item.');
      }
    });
  }

  assignChecklist(checklistId: string, staffId: string) {
    this.api.patch<any>(`checklists/${checklistId}`, { assigned_to: staffId || null }).subscribe({
      next: () => this.fetchChecklists(),
      error: (err) => alert(err.error?.message || 'Failed to assign checklist.')
    });
  }

  getChecklistProgress(checklist: any): number {
    if (!checklist.items || checklist.items.length === 0) return 0;
    const checked = checklist.items.filter((i: any) => i.isChecked).length;
    return Math.round((checked / checklist.items.length) * 100);
  }

  getActiveCount(): number {
    return this.checklists().filter(c => c.status !== 'completed').length;
  }

  getInProgressCount(): number {
    return this.checklists().filter(c => this.getChecklistDisplayStatus(c) === 'In Progress').length;
  }

  getPendingActionCount(): number {
    return this.checklists().filter(c => {
      const ds = this.getChecklistDisplayStatus(c);
      return ds === 'Pending' || ds === 'Action Required';
    }).length;
  }

  getAssigneeName(cl: any): string {
    if (!cl || !cl.assigned_to) {
      return 'Yet to Assign';
    }
    return cl.assigned_to.owner_name || cl.assigned_to.name || 'Yet to Assign';
  }

  getAssigneeInitial(cl: any): string {
    const name = this.getAssigneeName(cl);
    if (name === 'Yet to Assign') return 'Y';
    return name.charAt(0).toUpperCase();
  }

  getCompletedThisWeekCount(): number {
    return this.checklists().filter(c => this.getChecklistDisplayStatus(c) === 'Completed').length; // Mocking "This week" with just completed count
  }

  getChecklistDisplayStatus(c: any): string {
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

  isActionRequired(c: any): boolean {
    const serviceNameLower = (c.service_name || '').toLowerCase();
    const SERVICES_WITH_FORMS = [
      'dpiit', 'duns', 'private limited', 'trade mark', 'trademark', 'copyright', 'llp', 'msme', 'gst', 'iso', 'fssai',
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

  getChecklistStatusClass(status: string): string {
    const s = (status || '').toLowerCase().replace(' ', '-');
    const map: Record<string, string> = {
      'pending': 'status-pending',
      'action-required': 'status-action-required',
      'in-progress': 'status-in-progress',
      'completed': 'status-completed'
    };
    return map[s] || 'status-pending';
  }

  updateChecklistStage(checklistId: string, stage: string) {
    this.api.patch(`checklists/${checklistId}`, { stage }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const updated = this.checklists().map(c => c._id === res.checklist._id ? res.checklist : c);
          this.checklists.set(updated);
        }
      },
      error: (err) => console.error('Error updating stage:', err)
    });
  }

  // Final Documents Upload State
  finalDocsToUpload: { file: File }[] = [];
  isFinalDocUploading = false;

  onFinalFilesSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.finalDocsToUpload.push({
          file: files[i]
        });
      }
    }
  }

  removeFinalDocFile(index: number) {
    this.finalDocsToUpload.splice(index, 1);
  }

  submitFinalDocuments(checklistId: string) {
    this.isFinalDocUploading = true;
    const formData = new FormData();

    for (const doc of this.finalDocsToUpload) {
      formData.append('final_files', doc.file);
    }

    this.api.post(`checklists/${checklistId}/final-documents`, formData).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const updated = this.checklists().map(c => c._id === res.checklist._id ? res.checklist : c);
          this.checklists.set(updated);
          this.finalDocsToUpload = [];
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

  isRequestDocModalOpen = signal<boolean>(false);
  newDocRequestName = '';

  openRequestDocModal(checklistId: string) {
    this.selectedChecklistId = checklistId;
    this.newDocRequestName = '';
    this.checklistErrorMessage.set('');
    this.isRequestDocModalOpen.set(true);
  }

  closeRequestDocModal() {
    this.isRequestDocModalOpen.set(false);
    this.selectedChecklistId = '';
    this.newDocRequestName = '';
  }

  submitRequestDoc() {
    if (!this.newDocRequestName.trim()) {
      this.checklistErrorMessage.set('Document name is required');
      return;
    }

    const cl = this.checklists().find(c => c._id === this.selectedChecklistId);
    if (!cl) return;

    const requested_documents = cl.requested_documents || [];
    requested_documents.push({
      name: this.newDocRequestName,
      isUploaded: false
    });

    this.api.patch(`checklists/${this.selectedChecklistId}`, {
      requested_documents,
      stage: 'documentRequested'
    }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const updated = this.checklists().map(c => c._id === res.checklist._id ? res.checklist : c);
          this.checklists.set(updated);
          this.closeRequestDocModal();
        }
      },
      error: (err) => {
        this.checklistErrorMessage.set(err.error?.message || 'Error requesting document');
      }
    });
  }
}
