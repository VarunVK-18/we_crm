import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Clock02Icon, Alert01Icon, CheckmarkCircle01Icon, ArrowUpRight01Icon, ArrowLeftRightIcon, AiSecurity01Icon, FilterIcon, DocumentAttachmentIcon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';
import { McaFormComponent } from '../forms/mca-form/mca-form';

@Component({
  selector: 'app-client-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent, McaFormComponent],
  templateUrl: './client-compliance.html',
  styleUrl: './client-compliance.css'
})
export class ClientCompliance implements OnInit, OnDestroy {
  readonly Clock02Icon = Clock02Icon;
  readonly Alert01Icon = Alert01Icon;
  readonly CheckmarkCircle01Icon = CheckmarkCircle01Icon;
  readonly ArrowUpRight01Icon = ArrowUpRight01Icon;
  readonly ArrowLeftRightIcon = ArrowLeftRightIcon;
  readonly AiSecurity01Icon = AiSecurity01Icon;
  readonly FilterIcon = FilterIcon;
  readonly DocumentAttachmentIcon = DocumentAttachmentIcon;

  reminders = signal<any[]>([]);
  checklists = signal<any[]>([]);
  certificates = signal<any[]>([]);
  isLoading = signal(true);
  user = signal<any>(null);
  isPendingModalOpen = signal(false);
  isEntityModalOpen = signal(false);
  currentEntity = signal<string>('All Entities');
  taskFilter = signal<'pending' | 'completed' | 'all'>('pending');
  timelineTab = signal<'all' | 'pending' | 'completed'>('all');

  // Compliance Case State
  isCase1 = signal<boolean>(false);
  shareCapitalUploaded = signal<boolean>(false);
  isUploadingShareCapital = signal<boolean>(false);

  // ADT-1 state
  isAdt1Completed = computed(() => {
    return this.reminders().some(r => 
      r.title && r.title.includes('ADT-1') && (r.status === 'Completed' || r.status === 'Done')
    );
  });

  // Computed Values
  availableEntities = computed(() => {
    // Use a canonical (lowercase) key map to avoid case-duplicate entries
    const canonicalMap = new Map<string, string>();

    this.reminders().forEach(r => {
      const name = r.entityName?.trim();
      if (name && name !== 'Individual') {
        // First occurrence wins as the display name
        if (!canonicalMap.has(name.toLowerCase())) {
          canonicalMap.set(name.toLowerCase(), name);
        }
      }
    });

    // Also add from checklists — only if not already present from reminders
    this.checklists().forEach(c => {
      // Priority: details.entityName > details.companyName > client_id.company_name
      const entityName = (
        c.details?.entityName ||
        c.details?.companyName ||
        c.details?.proposed_company_name ||
        c.details?.businessName ||
        c.client_id?.company_name
      )?.trim();
      if (entityName && !canonicalMap.has(entityName.toLowerCase())) {
        canonicalMap.set(entityName.toLowerCase(), entityName);
      }
    });

    return Array.from(canonicalMap.values()).sort();
  });

  filteredTasks = computed(() => {
    const entity = this.currentEntity();
    if (entity === 'All Entities') return this.reminders();
    // Case-insensitive comparison to avoid mismatch
    return this.reminders().filter(r =>
      r.entityName && r.entityName.trim().toLowerCase() === entity.toLowerCase()
    );
  });

  pendingTasks = computed(() => this.filteredTasks().filter(r => r.status?.toLowerCase() !== 'completed'));
  
  modalTasks = computed(() => {
    const filter = this.taskFilter();
    const tasks = this.filteredTasks();
    if (filter === 'pending') return tasks.filter(r => r.status?.toLowerCase() !== 'completed');
    if (filter === 'completed') return tasks.filter(r => r.status?.toLowerCase() === 'completed');
    return tasks;
  });

  groupedModalTasks = computed(() => {
    const tasks = this.modalTasks();
    const entity = this.currentEntity();
    const map = new Map<string, any[]>();
    
    tasks.forEach(r => {
      const key = entity === 'All Entities' ? (r.entityName || 'Other') : r.status;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  });
  healthScore = computed(() => {
    const pending = this.pendingTasks();
    if (pending.length === 0) return 1.0;
    
    // 100% = No pending compliances
    // 90% = Upcoming compliances only
    // 75% = Due Soon compliances
    // 50% = Critical compliances
    // 0-25% = Overdue compliances
    let minScore = 0.9;
    for (const t of pending) {
      if (t.status === 'Overdue') minScore = Math.min(minScore, 0.25);
      else if (t.status === 'Critical') minScore = Math.min(minScore, 0.5);
      else if (t.status === 'Due Soon') minScore = Math.min(minScore, 0.75);
    }
    return minScore;
  });

  healthStatus = computed(() => {
    const score = this.healthScore();
    if (score >= 0.9) return 'EXCELLENT';
    if (score >= 0.75) return 'GOOD';
    if (score >= 0.5) return 'WARNING';
    return 'CRITICAL';
  });

  healthMessage = computed(() => {
    const score = this.healthScore();
    if (score >= 0.9) return 'Your compliance health is safe.';
    if (score >= 0.75) return 'Some items are due soon.';
    if (score >= 0.5) return 'Critical action required soon.';
    return 'Action required: resolve overdue items.';
  });

  urgentReminders = computed(() => {
    const pending = this.pendingTasks();
    if (pending.length === 0) return [];
    const minDaysLeft = Math.min(...pending.map(t => t.daysLeft));
    return pending.filter(t => t.daysLeft === minDaysLeft);
  });

  timelineItems = computed(() => {
    let tasks = this.filteredTasks();
    const tab = this.timelineTab();
    
    if (tab === 'pending') {
      tasks = tasks.filter(r => r.status?.toLowerCase() !== 'completed');
    } else if (tab === 'completed') {
      tasks = tasks.filter(r => r.status?.toLowerCase() === 'completed');
    }

    if (tasks.length === 0) {
      return [];
    }
    
    return tasks.map(r => ({
      ...r,
      title: r.title,
      status: r.daysLeft < 0 ? 'Overdue - Penalty Applicable' : (r.daysLeft === 0 ? 'Due Today' : `${r.daysLeft} Days Remaining`),
      type: r.status // Upcoming, Due Soon, Critical, Overdue, Completed
    }));
  });

  // Certificate Computations
  filteredCertificates = computed(() => {
    const entity = this.currentEntity();
    if (entity === 'All Entities') return this.certificates();
    return this.certificates().filter(c => 
      c.entityName && c.entityName.trim().toLowerCase() === entity.toLowerCase()
    );
  });

  hasWarningCertificates = computed(() => {
    return this.certificates().some(c => 
      ['Due Soon', 'Action Required', 'Critical', 'Expired'].includes(c.renewalStatus)
    );
  });

  warningCertificates = computed(() => {
    return this.certificates().filter(c => 
      ['Due Soon', 'Action Required', 'Critical', 'Expired'].includes(c.renewalStatus)
    );
  });

  documentsRequiringSignature = computed(() => {
    const tasks = this.filteredTasks();
    const docs: { task: any, docKey: string, docLabel: string, fileId: string, isUploaded: boolean }[] = [];
    
    tasks.forEach(task => {
      this.documentTypes.forEach(d => {
        // Only show if the document exists AND the client hasn't uploaded a reply yet
        if (task[d.key + 'Document'] && !task[d.key + 'ReplyDocument']) {
          docs.push({
            task: task,
            docKey: d.key,
            docLabel: d.label,
            fileId: task[d.key + 'Document'],
            isUploaded: false // Always false now, since we filter out uploaded ones
          });
        }
      });
    });
    
    return docs;
  });

  isRenewModalOpen = signal(false);
  selectedCertForRenewal = signal<any>(null);
  isRenewing = signal(false);

  private entityChangeHandler = (e: Event) => {
    const name = (e as CustomEvent).detail as string;
    // Map global 'All' to compliance's 'All Entities' convention
    this.currentEntity.set(name === 'All' ? 'All Entities' : name);
  };

  // --- Chat Feature ---
  isChatModalOpen = signal<boolean>(false);
  chatMessages = signal<any[]>([]);
  isLoadingChat = signal<boolean>(false);
  newChatMessage: string = '';
  chatPollingInterval: any;
  orderIdForChat: string | null = null;
  
  openChatModal() {
    this.isChatModalOpen.set(true);
    const uid = this.user()?._id || this.user()?.id;
    this.orderIdForChat = 'compliance_' + uid;
    this.startChatDataFetch();
    
    // Add escape key listener
    document.addEventListener('keydown', this.onEscapeKey);
  }
  
  onEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.closeChatModal();
  }

  startChatDataFetch() {
    this.fetchChatMessages(true);
    if (this.chatPollingInterval) clearInterval(this.chatPollingInterval);
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
    document.removeEventListener('keydown', this.onEscapeKey);
  }

  fetchChatMessages(showLoading = false) {
    const chatId = this.orderIdForChat;
    if (!chatId) return;
    
    if (showLoading) this.isLoadingChat.set(true);
    this.api.get<any>(`chat/${chatId}`).subscribe({
      next: (res) => {
        if (res.success) {
          const prevCount = this.chatMessages().length;
          this.chatMessages.set(res.messages);
          if (res.messages.length > prevCount) {
            this.scrollToBottomChat();
          }
          this.markChatAsSeen(chatId);
        }
        if (showLoading) this.isLoadingChat.set(false);
      },
      error: (err) => {
        console.error('Error fetching chat messages:', err);
        if (showLoading) this.isLoadingChat.set(false);
      }
    });
  }

  markChatAsSeen(chatId: string) {
    let userRole = 'client';
    try {
      userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'client';
    } catch(e) {}
    this.api.put(`chat/${chatId}/seen`, { viewerRole: userRole }).subscribe({
      error: (err) => console.error('Error marking messages as seen:', err)
    });
  }

  onChatKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendChatMessage();
    }
  }

  sendChatMessage() {
    if (!this.newChatMessage.trim()) return;
    const chatId = this.orderIdForChat;
    if (!chatId) return;
    
    const content = this.newChatMessage.trim();
    this.newChatMessage = ''; 
    
    let currentUser: any = {};
    try {
      currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    } catch(e) {}
    const senderRole = currentUser.role || 'client';
    
    this.api.post<any>(`chat/${chatId}`, {
      senderId: currentUser._id || currentUser.id,
      senderRole: senderRole,
      content: content,
      mentions: []
    }).subscribe({
      next: (res) => {
        if (res.success && res.message) {
          this.chatMessages.update(prev => [...prev, res.message]);
          this.scrollToBottomChat();
        }
      },
      error: (err) => {
        console.error('Error sending chat message:', err);
      }
    });
  }

  shouldShowDateDivider(index: number): boolean {
    if (index === 0) return true;
    const currentMsg = this.chatMessages()[index];
    const prevMsg = this.chatMessages()[index - 1];
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  }

  scrollToBottomChat() {
    setTimeout(() => {
      const containers = document.querySelectorAll('.chat-messages-container');
      containers.forEach(container => {
        container.scrollTop = container.scrollHeight;
      });
    }, 100);
  }

  constructor(private api: Api, private router: Router) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
      this.fetchReminders();
      this.fetchChecklists();
      this.fetchCertificates();
      this.fetchUserComplianceProfile();
    } else {
      this.isLoading.set(false);
    }

    // Sync with global entity switcher
    const saved = localStorage.getItem('client_selected_entity');
    if (saved && saved !== 'All') {
      this.currentEntity.set(saved);
    }
    window.addEventListener('entityChanged', this.entityChangeHandler);
  }

  onMcaFormCompleted() {
    // Reload user data so the form disappears
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res) => {
        const u = res.user || res;
        if (u) {
          this.user.set(u);
          localStorage.setItem('user', JSON.stringify(u));
        }
      }
    });
  }

  ngOnDestroy() {
    window.removeEventListener('entityChanged', this.entityChangeHandler);
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval);
    }
    document.removeEventListener('keydown', this.onEscapeKey);
  }

  fetchChecklists() {
    this.api.get<any>('my-checklists').subscribe({
      next: (res) => {
        this.checklists.set(res.checklists || []);
      },
      error: (err) => console.error('Failed to fetch checklists for entities:', err)
    });
  }

  fetchUserComplianceProfile() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res) => {
        const u = res.user || res;
        this.isCase1.set(u.compliance_case === 'case1');
        this.shareCapitalUploaded.set(!!u.share_capital_bank_statement);
      },
      error: () => {}
    });
  }

  uploadShareCapitalStatement(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;

    this.isUploadingShareCapital.set(true);
    const formData = new FormData();
    formData.append('file', file);

    this.api.post<any>(`compliance/clients/${uid}/upload-share-capital`, formData).subscribe({
      next: (res) => {
        if (res.success) {
          this.shareCapitalUploaded.set(true);
        }
        this.isUploadingShareCapital.set(false);
      },
      error: (err) => {
        console.error('Failed to upload share capital statement:', err);
        this.isUploadingShareCapital.set(false);
        alert('Upload failed. Please try again.');
      }
    });
  }

  fetchReminders() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) {
      this.isLoading.set(false);
      return;
    }

    this.api.get<any>(`compliance/tasks/user/${uid}`).subscribe({
      next: (res) => {
        const fetched = res.tasks || [];
        // Filter out Incorporation renewals since they don't actually expire/renew
        const filtered = fetched.filter((r: any) => !r.title?.toLowerCase().includes('incorporation'));
        const mapped = filtered.map((r: any) => {
          // Resolve entityName with priority order
          const entityName =
            r.entityName?.trim() ||
            (r.companyId && typeof r.companyId === 'object'
              ? r.companyId.company_name
              : null) ||
            r.checklistId?.details?.entityName ||
            r.checklistId?.details?.companyName ||
            r.checklistId?.details?.proposed_company_name ||
            r.checklistId?.details?.businessName ||
            'Individual';

          return {
            ...r,
            id: r._id,
            entityName: entityName.trim(),
            message:
              r.daysLeft <= 0
                ? 'Overdue - Penalty Applicable'
                : `Due in ${r.daysLeft} days`,
          };
        });
        this.reminders.set(mapped);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch compliance tasks:', err);
        this.isLoading.set(false);
      },
    });
  }

  fetchCertificates() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    this.api.get<any>(`certificates/client/${uid}`).subscribe({
      next: (res) => {
        if (res.certificates) {
          this.certificates.set(res.certificates);
        }
      },
      error: (err) => console.error('Failed to fetch certificates', err)
    });
  }

  // Removed file upload state since clients do not complete tasks
  
  documentTypes = [
    { key: 'notice', label: 'Notice' },
    { key: 'shareholders', label: 'List Of Share Holders' },
    { key: 'directors', label: 'List Of Directors' },
    { key: 'notes', label: 'Notes' },
    { key: 'temporary', label: 'Temporary Document' }
  ];

  getRequiredSignatures(task: any) {
    // Only return documents that exist on the task, so the client knows what to sign
    return this.documentTypes.filter(d => !!task[d.key + 'Document']);
  }

  getDocumentUrl(docObj: any): string {
    if (!docObj) return '';
    const id = typeof docObj === 'object' ? (docObj._id || docObj.id) : docObj;
    return `${this.api.serverUrl}api/documents/${id}`;
  }

  uploadClientReply(event: any, taskId: string, docType: string) {
    const file = event.target.files[0];
    if (!file) return;

    this.isLoading.set(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', docType);

    this.api.post<any>(`compliance/tasks/${taskId}/upload`, formData).subscribe({
      next: () => {
        this.fetchReminders(); // Refresh tasks
        alert('Document uploaded successfully!');
      },
      error: (err) => {
        console.error('Failed to upload document', err);
        this.isLoading.set(false);
        alert('Failed to upload document. Please try again.');
      }
    });
  }

  renewService(serviceName: string) {
    // Navigate to the services catalog, where client-services component will
    // automatically find the correct category and auto-select the service.
    this.isPendingModalOpen.set(false);
    this.router.navigate(['/client/services'], {
      queryParams: { serviceName: serviceName }
    });
  }

  switchEntity(entity: string) {
    this.currentEntity.set(entity);
    this.isEntityModalOpen.set(false);
  }

  openRenewModal(cert: any) {
    this.selectedCertForRenewal.set(cert);
    this.isRenewModalOpen.set(true);
  }

  confirmRenewal() {
    const cert = this.selectedCertForRenewal();
    if (!cert) return;
    
    this.isRenewing.set(true);
    this.api.post<any>(`certificates/${cert._id}/renew`, {}).subscribe({
      next: (res) => {
        alert('Renewal request submitted successfully!');
        this.isRenewing.set(false);
        this.isRenewModalOpen.set(false);
        this.fetchCertificates(); // Refresh to update status
      },
      error: (err) => {
        console.error('Renewal request failed', err);
        alert(err.error?.message || 'Failed to submit renewal request.');
        this.isRenewing.set(false);
      }
    });
  }
}
