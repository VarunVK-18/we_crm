import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { MessageMultiple01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-service-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './client-service-detail.html',
  styleUrl: './client-service-detail.css',
})
export class ClientServiceDetail implements OnInit, OnDestroy {
  MessageMultiple01Icon = MessageMultiple01Icon;
  user = signal<any>(null);
  clientManager = signal<any>(null);
  orderId = signal<string>('');
  order = signal<any>(null);
  
  // Chat
  chatMessages = signal<any[]>([]);
  newChatMessage = signal('');
  
  // UI State
  isChatOpen = signal(false);
  isLoading = signal(true);
  
  pollingInterval: any;

  constructor(
    private route: ActivatedRoute, 
    public location: Location,
    private api: Api
  ) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
      this.fetchClientManager();
    }
    
    this.route.params.subscribe(params => {
      this.orderId.set(params['id']);
      this.fetchOrderDetails();
      
      this.pollingInterval = setInterval(() => {
        this.fetchOrderDetails(true);
        if (this.isChatOpen()) {
          this.fetchChatMessages(true);
        }
      }, 4000);
    });
  }

  fetchClientManager() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res) => {
        if (res.user && res.user.assigned_to) {
          this.clientManager.set(res.user.assigned_to);
        }
      },
      error: (err) => console.error('Failed to fetch client manager:', err)
    });
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  toggleChat() {
    this.isChatOpen.set(!this.isChatOpen());
    if (this.isChatOpen()) {
      this.fetchChatMessages();
    }
  }

  fetchOrderDetails(silent = false) {
    if (!silent) this.isLoading.set(true);
    
    // We can fetch single order if we had an endpoint, but since the flutter app uses /my-checklists, we can filter it or we can try GET /orders/:id
    // Let's use GET /orders/:id if it works for clients, else we fetch my-checklists and filter
    const uid = this.user()?._id || this.user()?.id;
    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        const found = checklists.find((c: any) => c._id === this.orderId());
        if (found) {
          const isAssigned = found.assigned_to && found.assigned_to.role !== 'client_manager';
          found.derivedStatus = found.status === 'completed' ? 'completed' : (!isAssigned ? 'not-initialized' : 'active');
          this.order.set(found);
        }
        if (!silent) this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch order', err);
        if (!silent) this.isLoading.set(false);
      }
    });
  }

  toggleChecklistItem(item: any, event: Event) {
    event.stopPropagation();
    const updatedStatus = !item.isChecked;
    const items = [...this.order().items];
    const itemIndex = items.findIndex((i: any) => i._id === item._id);
    if (itemIndex > -1) {
      items[itemIndex].isChecked = updatedStatus;
      
      this.api.put<any>(`checklists/${this.orderId()}`, { items }).subscribe({
        next: () => {
          this.order.update(o => ({ ...o, items }));
        },
        error: (err) => {
          console.error('Failed to update item', err);
          // revert
          items[itemIndex].isChecked = !updatedStatus;
        }
      });
    }
  }

  fetchChatMessages(silent = false) {
    const id = this.orderId();
    if (!id) return;
    
    this.api.get<any>(`chat/${id}`).subscribe({
      next: (res: any) => {
        if (res && res.messages) {
          const prevCount = this.chatMessages().length;
          this.chatMessages.set(res.messages);
          if (res.messages.length > prevCount || !silent) {
            this.scrollToBottomChat();
          }
          this.markChatAsSeen(id);
        }
      }
    });
  }

  markChatAsSeen(orderId: string) {
    this.api.put(`chat/${orderId}/seen`, { viewerRole: 'client' }).subscribe();
  }

  sendChatMessage() {
    if (!this.newChatMessage().trim()) return;
    
    const content = this.newChatMessage().trim();
    this.newChatMessage.set('');
    
    this.api.post<any>(`chat/${this.orderId()}`, {
      senderId: this.user()?._id || this.user()?.id,
      senderRole: 'client',
      content: content
    }).subscribe({
      next: (res: any) => {
        if (res && res.message) {
          this.chatMessages.update(prev => [...prev, res.message]);
          this.scrollToBottomChat();
        }
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
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      });
    }, 300);
  }

  getCompletedList(items: any[] | undefined): any[] {
    if (!items) return [];
    return items.filter(i => i.isChecked);
  }
}
