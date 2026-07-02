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

import { ChatCacheService, ClientChatGroup } from '../../services/chat-cache.service';
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
  
  chatCache = inject(ChatCacheService);

  // Conversations State
  groupedConversations = this.chatCache.groupedConversations;
  filteredGroupedConversations = signal<ClientChatGroup[]>([]);
  isLoadingConversations = signal<boolean>(true);
  searchQuery = signal<string>('');

  // Active Chat State
  activeGroup = this.chatCache.activeGroup;
  activeConversation = this.chatCache.activeConversation;
  chatMessages = this.chatCache.chatMessages;
  isLoadingChat = signal<boolean>(false);
  newChatMessage = signal<string>('');
  chatPollingInterval: any;

  @Output() onViewService = new EventEmitter<string>();
  @Input() initialOrderId: string | null = null;
  @Input() initialClientId: string | null = null;

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
    
    // Check if we have cached conversations
    if (this.groupedConversations().length > 0) {
      this.isLoadingConversations.set(false);
      this.filterConversations(this.searchQuery());
      // Still fetch in background to get new messages silently
      this.fetchConversations(false);
      
      // If there's an active conversation in cache, restart its polling
      if (this.activeConversation()) {
        this.startChatPolling();
      }
    } else {
      this.fetchConversations(true);
    }
  }

  ngOnDestroy() {
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialOrderId'] && this.initialOrderId && this.groupedConversations().length > 0) {
      this.selectByOrderId(this.initialOrderId);
    }
    if (changes['initialClientId'] && this.initialClientId && this.groupedConversations().length > 0) {
      this.selectByClientId(this.initialClientId);
    }
  }

  fetchConversations(showLoading = true) {
    if (showLoading) this.isLoadingConversations.set(true);
    this.api.get<any>('chat/conversations/all').subscribe({
      next: (res) => {
        if (res.success) {
          const rawConvs = res.conversations || [];
          const groupsMap = new Map<string, ClientChatGroup>();

          rawConvs.forEach((conv: any) => {
            const clientId = conv.checklist?.client_id?._id;
            if (!clientId) return;

            if (!groupsMap.has(clientId)) {
              groupsMap.set(clientId, {
                client: conv.checklist.client_id,
                chats: [],
                latestMessageAt: new Date(conv.lastMessage.createdAt),
                totalUnreadCount: 0
              });
            }

            const group = groupsMap.get(clientId)!;
            group.chats.push(conv);
            group.totalUnreadCount += (conv.unreadCount || 0);

            const msgDate = new Date(conv.lastMessage.createdAt);
            if (msgDate > group.latestMessageAt) {
              group.latestMessageAt = msgDate;
            }
          });

          const groupsArray = Array.from(groupsMap.values()).sort((a, b) => b.latestMessageAt.getTime() - a.latestMessageAt.getTime());
          this.groupedConversations.set(groupsArray);
          this.filterConversations(this.searchQuery());
          
          if (this.initialOrderId && !this.activeConversation()) {
            this.selectByOrderId(this.initialOrderId);
          } else if (this.initialClientId && !this.activeConversation()) {
            this.selectByClientId(this.initialClientId);
          }
        }
        if (showLoading) this.isLoadingConversations.set(false);
      },
      error: (err) => {
        console.error('Error fetching conversations:', err);
        if (showLoading) this.isLoadingConversations.set(false);
      }
    });
  }

  selectByOrderId(orderId: string) {
    for (const group of this.groupedConversations()) {
      const conv = group.chats.find(c => c.checklist?._id === orderId);
      if (conv) {
        this.selectGroup(group, conv);
        return;
      }
    }
  }

  selectByClientId(clientId: string) {
    const group = this.groupedConversations().find(g => g.client?._id === clientId);
    if (group) {
      this.selectGroup(group);
    }
  }

  filterConversations(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.filteredGroupedConversations.set(this.groupedConversations());
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = this.groupedConversations().filter(group => {
      const clientName = group.client?.owner_name || '';
      const companyName = group.client?.company_name || '';
      return clientName.toLowerCase().includes(lowerQuery) || 
             companyName.toLowerCase().includes(lowerQuery) ||
             group.chats.some(c => (c.checklist?.service_name || '').toLowerCase().includes(lowerQuery));
    });
    this.filteredGroupedConversations.set(filtered);
  }

  selectGroup(group: ClientChatGroup, specificConv?: any) {
    this.activeGroup.set(group);
    
    // Select the specific conv or default to the most recent one
    const convToSelect = specificConv || group.chats[0];
    this.onServiceSwitch(convToSelect);
  }

  onServiceSwitch(conv: any) {
    // If it's the same conversation, don't clear messages
    const isSameConv = this.activeConversation()?.checklist?._id === conv.checklist._id;
    
    this.activeConversation.set(conv);
    
    if (!isSameConv) {
      this.chatMessages.set([]);
      this.fetchChatMessages(true);
    } else {
      // Just refresh in background
      this.fetchChatMessages(false);
    }
    this.markMessagesAsSeen(conv.checklist._id);
    
    // Optimistically clear the unread count in the sidebar
    this.groupedConversations.update(groups => groups.map(g => {
      if (g.client._id === this.activeGroup()?.client._id) {
        const updatedChats = g.chats.map(c => {
          if (c.checklist._id === conv.checklist._id) {
            return { ...c, unreadCount: 0 };
          }
          return c;
        });
        const newUnreadCount = updatedChats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        return { ...g, chats: updatedChats, totalUnreadCount: newUnreadCount };
      }
      return g;
    }));
    this.filterConversations(this.searchQuery());
    
    this.startChatPolling();
  }

  startChatPolling() {
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
        if (res && res.message) {
          // Replace temp message with real message from server
          this.chatMessages.update(msgs => msgs.map(m => m._id === tempMsg._id ? res.message : m));
        } else {
          // If no message returned, just remove temp and fetch
          this.chatMessages.update(msgs => msgs.filter(m => m._id !== tempMsg._id));
          this.fetchChatMessages();
        }
        this.fetchConversations(false); // refresh the sidebar list order silently
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
