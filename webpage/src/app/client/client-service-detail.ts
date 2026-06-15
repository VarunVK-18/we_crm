import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  newChatMessage: string = '';
  selectedSenderRole: string = 'client';
  
  // UI State
  isChatOpen = signal(false);
  isLoading = signal(true);
  
  pollingInterval: any;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
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
        if (res.user && res.user.client_manager) {
          this.clientManager.set(res.user.client_manager);
        } else if (res.user && res.user.assigned_to) {
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

  goToIncorpForm() {
    this.router.navigate(['/client/forms/incorp', this.order()?._id || this.order()?.id]);
  }

  goToLlpForm() {
    this.router.navigate(['/client/forms/llp', this.order()?._id || this.order()?.id]);
  }

  goToMsmeForm() {
    this.router.navigate(['/client/forms/msme', this.order()?._id || this.order()?.id]);
  }

  goToFssaiForm() {
    this.router.navigate(['/client/forms/fssai', this.order()?._id || this.order()?.id]);
  }

  goToTrademarkForm() {
    this.router.navigate(['/client/forms/trademark', this.order()?._id || this.order()?.id]);
  }

  goToGstForm() {
    this.router.navigate(['/client/forms/gst', this.order()?._id || this.order()?.id]);
  }

  goToIsoForm() {
    this.router.navigate(['/client/forms/iso', this.order()?._id || this.order()?.id]);
  }

  goToDscForm() {
    this.router.navigate(['/client/forms/dsc', this.order()?._id || this.order()?.id]);
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
          let status = found.status === 'completed' ? 'completed' : (!isAssigned ? 'not-initialized' : 'in-progress');
          
          if (status === 'in-progress') {
            const isPrivateLimited = found.service_name === 'Private Limited Incorporation';
            const isLLP = found.service_name === 'LLP Incorporation';
            const isFSSAI = found.service_name === 'FSSAI Food License';
            
            if (isPrivateLimited && (!found.details || !found.details.companyName)) {
              status = 'action-required';
            } else if (isLLP && (!found.details || !found.details.llpName)) {
              status = 'action-required';
            } else if (isFSSAI && (!found.details || !found.details.fssai_business_type)) {
              status = 'action-required';
            }
          }
          
          found.derivedStatus = status;
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
    if (!this.newChatMessage.trim()) return;
    
    const content = this.newChatMessage.trim();
    this.newChatMessage = '';
    
    this.api.post<any>(`chat/${this.orderId()}`, {
      senderId: this.user()?._id || this.user()?.id,
      senderRole: this.selectedSenderRole,
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

  getParsedDirectors(): any[] {
    const o = this.order();
    if (!o || !o.details || !o.details.directors) return [];
    try {
      if (typeof o.details.directors === 'string') {
        return JSON.parse(o.details.directors);
      }
      return o.details.directors;
    } catch (e) {
      return [];
    }
  }

  getRoleOptions() {
    const options = [{ value: 'client', label: 'Chat as Client' }];
    const directors = this.getParsedDirectors();
    for (let i = 0; i < directors.length; i++) {
      const dir = directors[i];
      const name = dir.directorName || dir.name || dir.fullName || '';
      const displayName = name ? `${name} (Dir ${i + 1})` : `Director ${i + 1}`;
      options.push({ value: `director_${i + 1}`, label: `Chat as ${displayName}` });
    }
    return options;
  }

  formatRole(role: string): string {
    if (!role) return '';
    if (role === 'admin') return 'Manager';
    if (role === 'client_manager') return 'Client Manager';
    if (role === 'filing_staff') return 'Filing Staff';
    if (role === 'staff') return 'Client Support';
    if (role.startsWith('director_')) {
      const parts = role.split('_');
      const idx = parseInt(parts[1], 10);
      if (!isNaN(idx)) {
        const directors = this.getParsedDirectors();
        if (idx > 0 && idx <= directors.length) {
          const dir = directors[idx - 1];
          const name = dir.directorName || dir.name || dir.fullName || '';
          return name ? `Dir ${idx}: ${name}` : `Director ${idx}`;
        }
      }
      return `Director ${parts[1]}`;
    }
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  goToInvoice() {
    this.router.navigate(['/client/invoice', this.orderId()]);
  }

  downloadDocument(doc: any) {
    if (!doc.document_id) return;
    this.api.getBlob(`documents/${doc.document_id}`).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        console.error('Failed to download document:', err);
        alert('Failed to load document');
      }
    });
  }

  filterFinalDocs(docs: any[]) {
    if (!docs) return [];
    return docs.filter(d => !d?.name?.startsWith('director_'));
  }

  filterRequestedDocs(docs: any[]) {
    if (!docs) return [];
    return docs.filter(d => !d?.name?.startsWith('director_'));
  }

  uploadRequestedDocument(doc: any, event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    // In a real app we would use FormData to upload the file to the server.
    // For now we just mark it as uploaded in the UI.
    alert('File selected for upload: ' + file.name + '. Implementation pending backend endpoint.');
    doc.isUploaded = true;
  }
}
