import { Component, OnInit, OnDestroy, signal, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  PlusSignIcon, 
  Cancel01Icon 
} from '@hugeicons/core-free-icons';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-completed-checklists',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent],
  templateUrl: './completed-checklists.html',
  styleUrl: './completed-checklists.css'
})
export class CompletedChecklists implements OnInit, OnDestroy {
  @Output() onViewChecklist = new EventEmitter<string>();
  isLoading = signal<boolean>(true);
  user = signal<any>(null);
  checklists = signal<any[]>([]);
  teams = input<any[]>([]);
  clients = signal<any[]>([]);
  pollInterval: any;
  searchQuery = signal<string>('');
  currentDirectoryTab = signal<string>('all');

  // Icon assets
  readonly PlusSignIcon = PlusSignIcon;
  readonly Cancel01Icon = Cancel01Icon;

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
    items: [] as {title: string, description: string}[]
  };
  newChecklistNewItemTitle = '';
  newChecklistNewItemDesc = '';

  availableServices = [
    'Compliance Audit',
    'GST Reconciliation',
    'Tax Advisory',
    'Corporate Filings',
    'FEMA Advisory'
  ];

  constructor(public api: Api) {}

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
          // Only show completed checklists
          this.checklists.set(res.checklists.filter((c: any) => c.status === 'completed'));
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
    let list = this.checklists();
    const tab = this.currentDirectoryTab();

    if (tab === 'pending_payment') {
      list = list.filter(c => this.hasPendingPayment(c));
    } else if (tab === 'final_delivered') {
      list = list.filter(c => !this.hasPendingPayment(c));
    }

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(c => 
        (c.service_name && c.service_name.toLowerCase().includes(query)) ||
        (c.client_id?.owner_name && c.client_id.owner_name.toLowerCase().includes(query)) ||
        (c.client_id?.company_name && c.client_id.company_name.toLowerCase().includes(query))
      );
    }
    return list;
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

  getChecklistStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'status-pending',
      in_progress: 'status-in-progress',
      completed: 'status-completed'
    };
    return map[status] || 'status-pending';
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
