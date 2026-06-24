import { Component, OnInit, OnDestroy, signal, computed, inject, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { 
  Message02Icon, 
  Search01Icon, 
  MoreVerticalIcon, 
  ArrowLeft01Icon, 
  CheckmarkBadge01Icon
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-staff-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-chat.html',
  styleUrl: './staff-chat.css'
})
export class StaffChatComponent implements OnInit, OnDestroy {
  // Icons
  readonly Message02Icon = Message02Icon;
  readonly Search01Icon = Search01Icon;
  readonly MoreVerticalIcon = MoreVerticalIcon;
  readonly ArrowLeft01Icon = ArrowLeft01Icon;
  readonly CheckmarkBadge01Icon = CheckmarkBadge01Icon;

  user = signal<any>(null);
  
  // Conversations State
  conversations = signal<any[]>([]);
  filteredConversations = signal<any[]>([]);
  isLoadingConversations = signal<boolean>(true);
  searchQuery = signal<string>('');

  // Active Chat State
  activeConversation = signal<any>(null);
  chatMessages = signal<any[]>([]);
  isLoadingChat = signal<boolean>(false);
  newChatMessage = signal<string>('');
  chatPollingInterval: any;

  @Output() onViewService = new EventEmitter<string>();
  @Input() initialOrderId: string | null = null;

  isSearchingMessages = signal<boolean>(false);
  messageSearchQuery = signal<string>('');

  searchMatchIndices = signal<number[]>([]);
  currentSearchMatchIndex = signal<number>(-1);
  private sanitizer = inject(DomSanitizer);

  updateSearchMatches(query: string) {
    if (!query) {
      this.searchMatchIndices.set([]);
      this.currentSearchMatchIndex.set(-1);
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    const matches: number[] = [];
    this.chatMessages().forEach((msg, idx) => {
      if (msg.content?.toLowerCase().includes(lowerQuery)) {
        matches.push(idx);
      }
    });
    
    this.searchMatchIndices.set(matches);
    if (matches.length > 0) {
      this.currentSearchMatchIndex.set(0);
      this.scrollToMessage(matches[0]);
    } else {
      this.currentSearchMatchIndex.set(-1);
    }
  }

  nextMatch() {
    const matches = this.searchMatchIndices();
    if (matches.length === 0) return;
    let curr = this.currentSearchMatchIndex();
    curr = (curr + 1) % matches.length;
    this.currentSearchMatchIndex.set(curr);
    this.scrollToMessage(matches[curr]);
  }

  prevMatch() {
    const matches = this.searchMatchIndices();
    if (matches.length === 0) return;
    let curr = this.currentSearchMatchIndex();
    curr = (curr - 1 + matches.length) % matches.length;
    this.currentSearchMatchIndex.set(curr);
    this.scrollToMessage(matches[curr]);
  }

  scrollToMessage(index: number) {
    setTimeout(() => {
      const msgEl = document.getElementById(`msg-${index}`);
      if (msgEl) {
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  getHighlightedContent(content: string, index: number): SafeHtml {
    const query = this.messageSearchQuery().trim();
    if (!query || !this.isSearchingMessages()) {
      return content; // Plain text will render fine
    }

    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    const startIndex = lowerContent.indexOf(lowerQuery);
    if (startIndex === -1) {
      return content;
    }

    const isCurrent = this.searchMatchIndices()[this.currentSearchMatchIndex()] === index;
    const highlightClass = isCurrent ? 'search-highlight active' : 'search-highlight';

    // Basic text highlight (first match)
    const startStr = content.substring(0, startIndex);
    const matchStr = content.substring(startIndex, startIndex + query.length);
    const endStr = content.substring(startIndex + query.length);

    // Escape HTML to prevent XSS
    const escapeHtml = (unsafe: string) => unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");

    const safeStart = escapeHtml(startStr);
    const safeMatch = escapeHtml(matchStr);
    const safeEnd = escapeHtml(endStr);

    const highlighted = `${safeStart}<span class="${highlightClass}">${safeMatch}</span>${safeEnd}`;
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  toggleMessageSearch() {
    this.isSearchingMessages.set(!this.isSearchingMessages());
    if (!this.isSearchingMessages()) {
      this.messageSearchQuery.set('');
    }
  }

  constructor(public api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchConversations();
  }

  ngOnDestroy() {
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialOrderId'] && this.initialOrderId && this.conversations().length > 0) {
      const conv = this.conversations().find(c => c.checklist?._id === this.initialOrderId);
      if (conv) {
        this.selectConversation(conv);
      }
    }
  }

  fetchConversations() {
    this.isLoadingConversations.set(true);
    this.api.get<any>('chat/conversations/all').subscribe({
      next: (res) => {
        if (res.success) {
          this.conversations.set(res.conversations || []);
          this.filterConversations(this.searchQuery());
          
          // Auto-select if initialOrderId provided
          if (this.initialOrderId && !this.activeConversation()) {
            const conv = this.conversations().find(c => c.checklist?._id === this.initialOrderId);
            if (conv) {
              this.selectConversation(conv);
            }
          }
        }
        this.isLoadingConversations.set(false);
      },
      error: (err) => {
        console.error('Error fetching conversations:', err);
        this.isLoadingConversations.set(false);
      }
    });
  }

  filterConversations(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.filteredConversations.set(this.conversations());
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = this.conversations().filter(conv => {
      const clientName = conv.checklist?.client_id?.owner_name || '';
      const companyName = conv.checklist?.client_id?.company_name || '';
      const serviceName = conv.checklist?.service_name || '';
      return clientName.toLowerCase().includes(lowerQuery) || 
             companyName.toLowerCase().includes(lowerQuery) || 
             serviceName.toLowerCase().includes(lowerQuery);
    });
    this.filteredConversations.set(filtered);
  }

  selectConversation(conv: any) {
    this.activeConversation.set(conv);
    this.chatMessages.set([]);
    this.fetchChatMessages(true);
    this.markMessagesAsSeen(conv.checklist._id);
    
    // Optimistically clear the unread count in the sidebar
    this.conversations.update(convs => convs.map(c => {
      if (c.checklist._id === conv.checklist._id) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    }));
    this.filterConversations(this.searchQuery());
    
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval);
    }
    
    this.chatPollingInterval = setInterval(() => {
      this.fetchChatMessages(false);
    }, 5000);
  }

  markMessagesAsSeen(orderId: string) {
    if (!orderId || !this.user()) return;
    
    this.api.put<any>(`chat/${orderId}/seen`, { viewerRole: this.user().role }).subscribe({
      next: (res) => {
        // Optionally handle success
      },
      error: (err) => console.error('Failed to mark messages as seen:', err)
    });
  }

  closeActiveChat() {
    this.activeConversation.set(null);
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval);
    }
  }

  fetchChatMessages(showLoading = false) {
    const orderId = this.activeConversation()?.checklist?._id;
    if (!orderId) return;

    if (showLoading) this.isLoadingChat.set(true);
    this.api.get<any>(`chat/${orderId}`).subscribe({
      next: (res) => {
        if (res.success) {
          const prevCount = this.chatMessages().length;
          this.chatMessages.set(res.messages);
          
          if (res.messages.length > prevCount && !showLoading) {
            setTimeout(() => this.scrollToBottom(), 100);
          } else if (showLoading) {
            setTimeout(() => this.scrollToBottom(), 100);
          }
        }
        if (showLoading) this.isLoadingChat.set(false);
      },
      error: (err) => {
        console.error('Error fetching messages:', err);
        if (showLoading) this.isLoadingChat.set(false);
      }
    });
  }

  sendChatMessage() {
    const message = this.newChatMessage().trim();
    if (!message) return;

    const orderId = this.activeConversation()?.checklist?._id;
    if (!orderId) return;

    const payload = {
      senderId: this.user()?._id,
      senderRole: this.user()?.role,
      content: message
    };

    // Optimistic UI update
    const tempMsg = {
      _id: 'temp-' + Date.now(),
      senderId: { _id: this.user()._id, owner_name: this.user().owner_name || this.user().name },
      senderRole: this.user().role,
      content: message,
      createdAt: new Date().toISOString(),
      isTemp: true
    };
    
    this.chatMessages.update(msgs => [...msgs, tempMsg]);
    this.newChatMessage.set('');
    setTimeout(() => this.scrollToBottom(), 100);

    this.api.post<any>(`chat/${orderId}`, payload).subscribe({
      next: (res) => {
        this.fetchChatMessages();
        this.fetchConversations(); // refresh the sidebar list order
      },
      error: (err) => {
        console.error('Failed to send message', err);
        // Remove temp message if failed
        this.chatMessages.update(msgs => msgs.filter(m => m._id !== tempMsg._id));
      }
    });
  }

  scrollToBottom() {
    const container = document.querySelector('.chat-messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
  
  getInitials(name: string): string {
    if (!name) return 'C';
    return name.charAt(0).toUpperCase();
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  shouldShowDateDivider(index: number): boolean {
    if (index === 0) return true;
    const currentMsg = this.chatMessages()[index];
    const prevMsg = this.chatMessages()[index - 1];
    
    if (!currentMsg?.createdAt || !prevMsg?.createdAt) return false;
    
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    
    return currentDate !== prevDate;
  }

  getDateLabel(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
      if (date.getFullYear() !== today.getFullYear()) {
        options.year = 'numeric';
      }
      return date.toLocaleDateString('en-US', options);
    }
  }

  getFileUrl(fileUrl: string): string {
    if (!fileUrl) return '';
    return this.api.getFileUrl(fileUrl);
  }

  openService() {
    const checklistId = this.activeConversation()?.checklist?._id;
    if (checklistId) {
      this.onViewService.emit(checklistId);
    }
  }
}
