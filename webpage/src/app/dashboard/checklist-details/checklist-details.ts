import { Component, OnInit, OnDestroy, signal, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';

@Component({
  selector: 'app-checklist-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checklist-details.html',
  styleUrl: './checklist-details.css'
})
export class ChecklistDetails implements OnInit, OnDestroy {
  @Output() onBack = new EventEmitter<void>();
  checklistId = input.required<string>();
  teams = input<any[]>([]);
  autoOpenChat = input<boolean>(false);
  private _chatOpenedLocally = false;

  user = signal<any>(null);
  checklist = signal<any>(null);
  pollInterval: any;

  // Icon assets removed, using material-symbols-outlined

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

  // --- Chat Feature ---
  isChatModalOpen = signal<boolean>(false);
  chatMessages = signal<any[]>([]);
  isLoadingChat = signal<boolean>(false);
  newChatMessage: string = '';
  chatPollingInterval: any;

  constructor(public api: Api) { }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchChecklist();

    // Poll for changes
    this.pollInterval = setInterval(() => {
      this.fetchChecklist();
    }, 5000);
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

  toggleChecklistItem(itemIndex: number) {
    const cl = this.checklist();
    if (!cl) return;
    this.api.patch<any>(`checklists/${cl._id}/items/${itemIndex}`, {}).subscribe({
      next: () => this.fetchChecklist(),
      error: (err) => alert(err.error?.message || 'Failed to update checklist item.')
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
      next: () => this.fetchChecklist(),
      error: (err) => alert(err.error?.message || 'Failed to assign director count.')
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

  getGeneralDetails(): { key: string, value: any }[] {
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
      entries.push({ key, value: cl.details[key] });
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

  submitFinalDocuments() {


    const cl = this.checklist();
    if (!cl) return;

    this.isFinalDocUploading = true;
    const formData = new FormData();

    for (const doc of this.finalDocsToUpload) {
      let finalName = doc.file.name;
      if (doc.docType && doc.docType !== 'Other') {
        const ext = doc.file.name.includes('.') ? doc.file.name.substring(doc.file.name.lastIndexOf('.')) : '';
        finalName = `${doc.docType}${ext}`;
      }
      const newFile = new File([doc.file], finalName, { type: doc.file.type });
      formData.append('final_files', newFile);
    }

    this.api.post(`checklists/${cl._id}/final-documents`, formData).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.checklist.set(res.checklist);
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
  openRequestDocModal() {
    this.newDocRequestName = '';
    this.checklistErrorMessage.set('');
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
        if (res && res.success) {
          this.checklist.set(res.checklist);
          this.closeRequestDocModal();
        }
      },
      error: (err) => {
        this.checklistErrorMessage.set(err.error?.message || 'Error requesting document');
      }
    });
  }

  // --- Chat Feature Methods ---
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
    if (userRole !== 'admin' && userRole !== 'client') {
      userRole = 'staff';
    }
    
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
    // Map internal staff roles to 'staff' for the Chat Message schema
    if (userRole !== 'admin' && userRole !== 'client') {
      userRole = 'staff';
    }

    this.api.post<any>(`chat/${chatId}`, {
      senderId: this.user()?._id || this.user()?.id,
      senderRole: userRole,
      content: content
    }).subscribe({
      next: (res: any) => {
        if (res && res.message) {
          // Optimistically append the message
          this.chatMessages.update(prev => [...prev, res.message]);
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
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
}
