import { Injectable, signal } from '@angular/core';

export interface ClientChatGroup {
  client: any;
  chats: any[];
  latestMessageAt: Date;
  totalUnreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatCacheService {
  // Conversations State
  groupedConversations = signal<ClientChatGroup[]>([]);
  
  // Active Chat State
  activeGroup = signal<ClientChatGroup | null>(null);
  activeConversation = signal<any>(null);
  chatMessages = signal<any[]>([]);
  
  lastFetched = signal<number>(0);

  clearCache() {
    this.groupedConversations.set([]);
    this.activeGroup.set(null);
    this.activeConversation.set(null);
    this.chatMessages.set([]);
    this.lastFetched.set(0);
  }
}
