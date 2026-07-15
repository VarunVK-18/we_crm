import { Component, OnInit, signal, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  ArrowLeft01Icon, 
  CheckmarkCircle01Icon, 
  Alert01Icon, 
  DocumentAttachmentIcon,
  Calendar02Icon,
  UserIcon,
  Building03Icon
} from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-compliance-details',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './compliance-details.html',
  styleUrl: './compliance-details.css'
})
export class ComplianceDetails implements OnInit, OnDestroy {
  @Input() entity!: { entityName: string, clientUid: string };
  @Output() goBack = new EventEmitter<void>();

  readonly ArrowLeft01Icon = ArrowLeft01Icon;
  readonly CheckmarkCircle01Icon = CheckmarkCircle01Icon;
  readonly Alert01Icon = Alert01Icon;
  readonly DocumentAttachmentIcon = DocumentAttachmentIcon;
  readonly Calendar02Icon = Calendar02Icon;
  readonly UserIcon = UserIcon;
  readonly Building03Icon = Building03Icon;

  tasks = signal<any[]>([]);
  isLoading = signal(false);
  templates = signal<any[]>([]);
  isGenerating = signal(false);

  // Modal states for documents
  activeDocAction = signal<{taskId: string, type: string, task: any} | null>(null);
  selectedFile: File | null = null;
  selectedTemplateId = signal<string>('');
  showMcaPassword = signal(false);

  // Modal specific signals
  activeTab = signal<'generate' | 'upload'>('generate');
  basePreviewHtml = signal<string>('');
  livePreviewHtml = signal<SafeHtml>('');
  templatePlaceholders = signal<{key: string, label: string}[]>([]);
  placeholderValues = signal<{[key: string]: string}>({});

  private sanitizer = inject(DomSanitizer);

  documentTypes = [
    { key: 'notice', label: 'Notice', templateName: 'notice' },
    { key: 'shareholders', label: 'List Of Share Holders', templateName: 'list of share holders' },
    { key: 'directors', label: 'List Of Directors', templateName: 'list of directors' },
    { key: 'notes', label: 'Notes', templateName: 'notes' },
    { key: 'temporary', label: 'Signing Document', templateName: '', isUploadOnly: true },
    { key: 'normal', label: 'Acknowledge Document', templateName: '', isUploadOnly: true }
  ];

  getTemplateFor(templateName: string): any {
    return this.templates().find(t => t.name.trim().toLowerCase() === templateName.toLowerCase()) || null;
  }

  getDocumentUrl(docObj: any): string {
    if (!docObj) return '';
    const id = typeof docObj === 'object' ? (docObj._id || docObj.id) : docObj;
    return `${this.api.serverUrl}api/documents/${id}`;
  }

  // --- Chat Feature ---
  isChatModalOpen = signal<boolean>(false);
  chatMessages = signal<any[]>([]);
  isLoadingChat = signal<boolean>(false);
  newChatMessage: string = '';
  chatPollingInterval: any;
  orderIdForChat: string | null = null;
  
  // Smart Mentions logic
  showMentionDropdown = false;
  mentionSearch = '';
  
  get currentMentionOptions(): {name: string, role: string, internalRole: string}[] {
    const opts = [];
    opts.push({ name: 'Client Manager', role: 'Client Manager', internalRole: 'client_manager' });
    opts.push({ name: 'Filing Staff', role: 'Filing Staff', internalRole: 'filling_staff' });
    opts.push({ name: this.entity?.entityName || 'Client', role: 'Client', internalRole: 'customer' });
    return opts;
  }
  
  get filteredMentionOptions() {
    const search = this.mentionSearch;
    if (!search) return this.currentMentionOptions;
    return this.currentMentionOptions.filter(o => 
      o.name.toLowerCase().includes(search.toLowerCase()) || 
      o.role.toLowerCase().includes(search.toLowerCase())
    );
  }

  openChatModal() {
    this.isChatModalOpen.set(true);
    this.orderIdForChat = 'compliance_' + this.entity.clientUid;
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
    let userRole = 'client_manager';
    try {
      userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'client_manager';
    } catch(e) {}
    this.api.put(`chat/${chatId}/seen`, { viewerRole: userRole }).subscribe({
      error: (err) => console.error('Error marking messages as seen:', err)
    });
  }

  onChatInput(event: any) {
    const val = this.newChatMessage;
    const cursor = event.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtPos !== -1) {
      const searchStr = textBeforeCursor.substring(lastAtPos + 1);
      if (!searchStr.includes(' ')) {
        this.showMentionDropdown = true;
        this.mentionSearch = searchStr;
        return;
      }
    }
    this.showMentionDropdown = false;
  }

  onChatKeydown(event: KeyboardEvent) {
    if (this.showMentionDropdown) {
      if (event.key === 'Escape') {
        this.showMentionDropdown = false;
        event.preventDefault();
      } else if (event.key === 'Enter') {
        const opts = this.filteredMentionOptions;
        if (opts.length > 0) {
          event.preventDefault();
          this.insertMention(opts[0]);
        }
      }
    } else {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.sendChatMessage();
      }
    }
  }

  insertMention(opt: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const inputEl = document.querySelector('.chat-input-area input') as HTMLInputElement;
    const cursor = inputEl ? inputEl.selectionStart || this.newChatMessage.length : this.newChatMessage.length;
    
    const val = this.newChatMessage;
    const textBeforeCursor = val.substring(0, cursor);
    const textAfterCursor = val.substring(cursor);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtPos !== -1) {
      const before = textBeforeCursor.substring(0, lastAtPos);
      const mentionStr = `@${opt.internalRole} `;
      const after = textAfterCursor;
      this.newChatMessage = before + mentionStr + after;
    }
    this.showMentionDropdown = false;
    
    setTimeout(() => {
      if (inputEl) inputEl.focus();
    }, 10);
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
    const senderRole = currentUser.role || 'client_manager';
    
    const mentions = [];
    if (content.includes('@client_manager')) mentions.push('client_manager');
    if (content.includes('@filling_staff')) mentions.push('filling_staff');
    if (content.includes('@customer')) mentions.push('customer');
    
    this.api.post<any>(`chat/${chatId}`, {
      senderId: currentUser._id || currentUser.id,
      senderRole: senderRole,
      content: content,
      mentions: mentions
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

  constructor(

    public api: Api
  ) {}

  getMissingDocuments(task: any) {
    return this.documentTypes.filter(d => !d.isUploadOnly && !task[d.key + 'Document']);
  }

  getAddedDocuments(task: any) {
    return this.documentTypes.filter(d => !!task[d.key + 'Document']);
  }

  ngOnInit() {
    if (this.entity) {
      this.fetchEntityTasks();
      this.fetchTemplates();
    }
  }

  ngOnDestroy() {
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval);
    }
    document.removeEventListener('keydown', this.onEscapeKey);
  }

  onGoBack() {
    this.goBack.emit();
  }

  fetchEntityTasks() {
    this.isLoading.set(true);
    const uid = this.entity.clientUid;
    this.api.get<any>(`compliance/tasks/user/${uid}`).subscribe({
      next: (res) => {
        const fetched = res.tasks || [];
        const entityTasks = fetched.filter((t: any) => {
          if (t.title && (
              t.title.includes('Share Capital Transfer') || 
              t.title.includes('Current Account Opening') || 
              t.title.includes('SH-1') ||
              t.title.includes('Incorporation (External)') ||
              t.title.includes('Certificate of Incorporation (External)')
          )) {
            return false;
          }
          const tEntityName = t.entityName?.trim() || 
            (t.companyId && typeof t.companyId === 'object' ? t.companyId.company_name : null) || 
            t.checklistId?.details?.entityName || 
            t.checklistId?.details?.companyName || 
            t.checklistId?.details?.proposed_company_name || 
            t.checklistId?.details?.businessName || 
            'Individual';
          return tEntityName.trim().toLowerCase() === this.entity.entityName.trim().toLowerCase();
        });
        
        const mapped = entityTasks.map((r: any) => ({
          ...r,
          id: r._id,
          message: r.daysLeft <= 0 ? 'Overdue - Penalty Applicable' : `Due in ${r.daysLeft} days`
        }));
        
        // Ensure "MCA Reports" always appears at the end of the list
        const nonMca = mapped.filter((t: any) => !t.title?.includes('MCA Reports'));
        const mca = mapped.filter((t: any) => t.title?.includes('MCA Reports'));
        
        this.tasks.set([...nonMca, ...mca]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch entity tasks', err);
        this.isLoading.set(false);
      }
    });
  }

  fetchTemplates() {
    this.api.get<any>('document-templates').subscribe({
      next: (res) => {
        this.templates.set(res.templates || []);
      },
      error: (err) => console.error('Failed to fetch templates', err)
    });
  }

  openDocAction(taskId: string, type: string, task: any) {
    this.activeDocAction.set({ taskId, type, task });
    this.selectedFile = null;
    this.selectedTemplateId.set('');
    this.activeTab.set('generate');
    this.livePreviewHtml.set('');
    this.placeholderValues.set({});
    
    // Auto-select template if available
    const docTypeDef = this.documentTypes.find(d => d.key === type);
    if (docTypeDef) {
      const tmpl = this.getTemplateFor(docTypeDef.templateName);
      if (tmpl) {
        this.selectedTemplateId.set(tmpl._id);
        this.onTemplateChange(tmpl._id);
      }
    }
  }

  cancelDocAction() {
    this.activeDocAction.set(null);
    this.selectedFile = null;
    this.selectedTemplateId.set('');
    this.basePreviewHtml.set('');
    this.livePreviewHtml.set('');
    this.placeholderValues.set({});
  }

  onTabChange(tab: 'generate' | 'upload') {
    this.activeTab.set(tab);
  }

  onTemplateChange(templateId: string) {
    this.selectedTemplateId.set(templateId);
    this.basePreviewHtml.set('');
    this.templatePlaceholders.set([]);
    this.placeholderValues.set({});
    
    const tmpl = this.templates().find(t => t._id === templateId);
    if (tmpl) {
      this.fetchLivePreview(tmpl._id, tmpl.html_content || '');
    } else {
      this.livePreviewHtml.set('');
    }
  }

  fetchLivePreview(templateId: string, fallbackHtml: string) {
    const action = this.activeDocAction();
    if (!action) return;
    this.api.post<any>(`document-templates/${templateId}/preview-populated`, { 
      checklist_id: action.task.checklistId?._id || action.task.checklistId 
    }).subscribe({
      next: (res) => {
        const html = res.html || fallbackHtml;
        this.basePreviewHtml.set(html);
        this.parsePlaceholders(html);
      },
      error: (err) => {
        console.error('Failed to fetch preview', err);
        this.basePreviewHtml.set(fallbackHtml);
        this.parsePlaceholders(fallbackHtml);
      }
    });
  }

  parsePlaceholders(rawHtml: string) {
    // Clean up HTML tags inside brackets
    const html = rawHtml.replace(/\{\{([\s\S]*?)\}\}/g, (m: string, p1: string) => {
      const cleanContent = p1.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      return `{{${cleanContent}}}`;
    });

    const regex = /\{\{([^}]+)\}\}/g;
    const matches = html.match(regex);
    if (matches) {
      const keys = [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))];
      const items = keys.map(k => {
        let label = k.replace(/_/g, ' ');
        label = label.charAt(0).toUpperCase() + label.slice(1);
        return { key: k, label };
      });
      this.templatePlaceholders.set(items);
    } else {
      this.templatePlaceholders.set([]);
    }
    this.updateLivePreviewLocally();
  }

  updateLivePreviewLocally() {
    const baseHtml = this.basePreviewHtml();
    if (!baseHtml) return;

    // Clean up the base HTML first so we can reliably match placeholders
    let html = baseHtml.replace(/\{\{([\s\S]*?)\}\}/g, (m: string, p1: string) => {
      const cleanContent = p1.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      return `{{${cleanContent}}}`;
    });

    const vals = this.placeholderValues();
    for (const item of this.templatePlaceholders()) {
      // Escape the item.key to be safe in regex
      const escapedKey = item.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
      
      let val = vals[item.key];
      if (!val) {
        val = `<span style="background:#fef08a;padding:0 2px;">{{${item.key}}}</span>`;
      }
      html = html.replace(regex, val);
    }
    this.livePreviewHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
  }

  onPlaceholderChange(key: string, value: string) {
    const vals = { ...this.placeholderValues() };
    vals[key] = value;
    this.placeholderValues.set(vals);
    
    this.updateLivePreviewLocally();
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadCustomDocument() {
    const action = this.activeDocAction();
    if (!action || !this.selectedFile) return;

    this.isLoading.set(true);
    const formData = new FormData();
    formData.append('document', this.selectedFile);
    formData.append('documentType', action.type);

    this.api.post<any>(`compliance/tasks/${action.taskId}/upload`, formData).subscribe({
      next: () => {
        this.fetchEntityTasks();
        this.cancelDocAction();
      },
      error: (err) => {
        console.error('Failed to upload document', err);
        this.isLoading.set(false);
      }
    });
  }

  markTaskComplete(taskId: string) {
    if (!confirm('Are you sure you want to mark this task as complete?')) return;
    
    this.api.post<any>(`compliance/tasks/${taskId}/complete`, {}).subscribe({
      next: () => {
        this.fetchEntityTasks(); // Refresh
      },
      error: (err) => {
        console.error('Failed to mark complete', err);
      }
    });
  }

  generateCustomDocument(templateId: string) {
    const action = this.activeDocAction();
    if (!action) return;
    
    this.isGenerating.set(true);
    this.api.post<any>(`compliance/tasks/${action.taskId}/generate-document`, {
      templateId,
      documentType: action.type,
      custom_values: this.placeholderValues()
    }).subscribe({
      next: (res) => {
        this.fetchEntityTasks(); // Refresh
        this.cancelDocAction();
        this.isGenerating.set(false);
      },
      error: (err) => {
        console.error('Generation failed', err);
        this.isGenerating.set(false);
      }
    });
  }

  directUploadDocument(event: any, documentType: string, task: any) {
    const file = event.target.files[0];
    if (event.target) event.target.value = '';
    if (!file) return;

    // We can just reuse the same toast/loading state, or a simpler one.
    // Let's use isGenerating for now to indicate work is happening.
    this.isGenerating.set(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    this.api.post<any>(`compliance/tasks/${task.id}/upload`, formData).subscribe({
      next: (res) => {
        this.fetchEntityTasks(); // Refresh
        this.isGenerating.set(false);
      },
      error: (err) => {
        console.error('Direct upload failed', err);
        this.isGenerating.set(false);
      }
    });
  }
}
