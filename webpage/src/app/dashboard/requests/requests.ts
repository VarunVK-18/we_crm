import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { UserIcon, CheckmarkBadge01Icon, Time01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class RequestsComponent implements OnInit {
  user = signal<any>(null);
  orders = signal<any[]>([]);
  teams = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');

  // Icons
  readonly UserIcon = UserIcon;
  readonly CheckmarkBadge01Icon = CheckmarkBadge01Icon;
  readonly Time01Icon = Time01Icon;

  // Filter state
  statusFilter = signal<string>('new');

  readonly NEW_STATUSES = ['new', 'pending'];
  readonly NEW_STAGES = ['reqreceived', 'quot pending', 'quotepending'];

  // An order is considered "new/incoming" if status is new/pending OR stage is reqReceived
  isNewOrder(o: any): boolean {
    const status = (o.status || '').toLowerCase();
    const stage = (o.stage || '').toLowerCase();
    return this.NEW_STATUSES.includes(status) || this.NEW_STAGES.includes(stage);
  }

  isImage(filename: string): boolean {
    if (!filename) return false;
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  filteredOrders = computed(() => {
    const filter = this.statusFilter();
    const all = this.orders();
    if (filter === 'all') return all;
    if (filter === 'new') return all.filter((o: any) => this.isNewOrder(o));
    if (filter === 'active') return all.filter((o: any) => !this.isNewOrder(o) && (o.status || '').toLowerCase() === 'active');
    return all.filter((o: any) => (o.status || '').toLowerCase() === filter);
  });

  orderCounts = computed(() => {
    const all = this.orders();
    return {
      all: all.length,
      new: all.filter((o: any) => this.isNewOrder(o)).length,
      active: all.filter((o: any) => !this.isNewOrder(o) && (o.status || '').toLowerCase() === 'active').length,
      complete: all.filter((o: any) => (o.status || '').toLowerCase() === 'complete').length,
    };
  });

  // Selected employee per order { orderId: employeeData }
  selectedEmployeeForOrder = signal<Record<string, any>>({});
  // Deal closed amount per order { orderId: number }
  dealClosedAmountForOrder = signal<Record<string, number>>({});
  advanceAmountPaidForOrder = signal<Record<string, number>>({});
  numberOfDirectorsForOrder = signal<Record<string, number>>({});

  constructor(public api: Api) { }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.user.set(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }

    this.fetchOrders();
    this.fetchTeam();
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(''), 3500);
  }

  getCompanyId(): string | null {
    const u = this.user();
    if (!u) return null;
    if (u.company_id && typeof u.company_id === 'object') {
      return u.company_id._id || null;
    }
    return u.company_id || null;
  }

  fetchOrders() {
    const companyId = this.getCompanyId();
    if (!companyId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.api.get<any>(`orders/company/${companyId}`).subscribe({
      next: (res: any) => {
        if (res && res.orders) {
          // Sort by newest first
          const sorted = [...res.orders].sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.orders.set(sorted);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching orders:', err);
        this.isLoading.set(false);
        this.showToast('Failed to load requests.', 'error');
      }
    });
  }

  fetchTeam() {
    this.api.get<any>('users/team-groups').subscribe({
      next: (res: any) => {
        // team-groups returns an array of groups directly
        if (Array.isArray(res)) {
          this.teams.set(res);
        } else if (res && res.groups) {
          this.teams.set(res.groups);
        }
      },
      error: (err: any) => console.error('Error fetching team:', err)
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

  onEmployeeSelectChange(orderId: string, event: any) {
    const empId = event.target.value;
    const allEmps = this.getFlatEmployees();
    const selectedEmp = allEmps.find(e => e.id === empId);

    if (selectedEmp) {
      this.selectedEmployeeForOrder.update(prev => ({ ...prev, [orderId]: selectedEmp }));
    } else {
      this.selectedEmployeeForOrder.update(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  }

  getFormattedAmount(orderId: string): string {
    const val = this.dealClosedAmountForOrder()[orderId];
    return val ? val.toLocaleString('en-IN') : '';
  }

  onAmountChange(orderId: string, event: any) {
    // Strip commas to get raw number
    const rawVal = event.target.value.replace(/,/g, '');
    // Allow empty or partial inputs, but parse as number when possible
    const val = rawVal && !isNaN(Number(rawVal)) ? Number(rawVal) : 0;

    this.dealClosedAmountForOrder.update(prev => ({ ...prev, [orderId]: val }));

    // Format the value in the input field while typing
    event.target.value = val ? val.toLocaleString('en-IN') : '';
  }

  getFormattedAdvance(orderId: string): string {
    const val = this.advanceAmountPaidForOrder()[orderId];
    return val ? val.toLocaleString('en-IN') : '';
  }

  onAdvanceChange(orderId: string, event: any) {
    const rawVal = event.target.value.replace(/,/g, '');
    const val = rawVal && !isNaN(Number(rawVal)) ? Number(rawVal) : 0;
    this.advanceAmountPaidForOrder.update(prev => ({ ...prev, [orderId]: val }));
    event.target.value = val ? val.toLocaleString('en-IN') : '';
  }

  getFormattedDirectors(orderId: string, defaultVal: any): string {
    const val = this.numberOfDirectorsForOrder()[orderId];
    if (val) return val.toString();
    return defaultVal ? defaultVal.toString() : '';
  }

  onDirectorsChange(orderId: string, event: any) {
    const val = parseInt(event.target.value) || 0;
    this.numberOfDirectorsForOrder.update(prev => ({ ...prev, [orderId]: val }));
  }

  assignEmployee(orderId: string) {
    const emp = this.selectedEmployeeForOrder()[orderId];
    const amount = this.dealClosedAmountForOrder()[orderId] || 0;
    const advance = this.advanceAmountPaidForOrder()[orderId] || 0;

    if (!emp || amount <= 0 || advance <= 0) {
      this.showToast('Please fill all details (Assign Expert, Deal Closed Amount, and Advance Amount Paid).', 'error');
      return;
    }

    const order = this.orders().find(o => o._id === orderId);
    const needsDirectors = ['Private Limited Incorporation', 'LLP Incorporation', 'One Person Company'].includes(order?.serviceType || order?.serviceName || '');
    let directors = this.numberOfDirectorsForOrder()[orderId];
    if (needsDirectors && !directors) {
      if (order?.details?.numberOfDirectors) {
        directors = Number(order.details.numberOfDirectors);
      } else {
        this.showToast('Please enter the Number of Directors/Partners.', 'error');
        return;
      }
    }

    const updateData: any = {
      assignedExpert: emp.name,
      expertPhone: emp.phone || '',
      stage: 'workAssigned',
      dealClosedAmount: amount,
      advanceAmountPaid: advance
    };

    if (needsDirectors && directors) {
      updateData.assignedNumberOfDirectors = directors;
    }

    this.api.put<any>(`orders/${orderId}`, updateData).subscribe({
      next: (res: any) => {
        this.showToast(`Assigned to ${emp.name} successfully!`, 'success');

        // Reset local selection & amount for this order
        this.selectedEmployeeForOrder.update(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        this.dealClosedAmountForOrder.update(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        this.advanceAmountPaidForOrder.update(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        this.numberOfDirectorsForOrder.update(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });

        this.fetchOrders();
      },
      error: (err: any) => {
        console.error('Error assigning employee', err);
        this.showToast('Failed to assign employee.', 'error');
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  objectKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj).filter(key => {
      const val = obj[key];
      // Hide null, undefined, empty string
      if (val === null || val === undefined || val === '') return false;
      
      // Check if it's a stringified empty array or array with empty objects
      if (typeof val === 'string' && val.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            if (parsed.length === 0) return false;
            // Check if all elements are objects with only empty strings
            const hasData = parsed.some(item => {
              if (typeof item === 'object' && item !== null) {
                return Object.values(item).some(v => v !== null && v !== undefined && v !== '');
              }
              return true;
            });
            if (!hasData) return false;
          }
        } catch (e) {}
      }
      return true;
    });
  }

  formatDetailValue(val: any): string {
    if (typeof val === 'string' && val.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return 'Included in Client Form';
        }
      } catch (e) {}
    }
    return val;
  }

  formatKey(key: string): string {
    if (!key) return '';
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // --- Chat Feature ---
  isChatModalOpen = signal<boolean>(false);
  selectedChatOrder = signal<any>(null);
  chatMessages = signal<any[]>([]);
  isLoadingChat = signal<boolean>(false);
  newChatMessage: string = '';
  chatPollingInterval: any;

  openChatModal(order: any) {
    this.selectedChatOrder.set(order);
    this.isChatModalOpen.set(true);
    this.fetchChatMessages(true);

    this.chatPollingInterval = setInterval(() => {
      this.fetchChatMessages(false);
    }, 5000);
  }

  closeChatModal() {
    this.isChatModalOpen.set(false);
    this.selectedChatOrder.set(null);
    this.chatMessages.set([]);
    this.newChatMessage = '';
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval);
    }
  }

  fetchChatMessages(showLoading = false) {
    const orderId = this.selectedChatOrder()?._id;
    if (!orderId) return;

    if (showLoading) this.isLoadingChat.set(true);
    this.api.get<any>(`chat/${orderId}`).subscribe({
      next: (res: any) => {
        if (res && res.messages) {
          const prevCount = this.chatMessages().length;
          this.chatMessages.set(res.messages);
          if (res.messages.length > prevCount || showLoading) {
            this.scrollToBottomChat();
          }
          this.markChatAsSeen(orderId);
        }
        if (showLoading) this.isLoadingChat.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching chat messages:', err);
        if (showLoading) this.isLoadingChat.set(false);
      }
    });
  }

  markChatAsSeen(orderId: string) {
    let userRole = this.user()?.role || 'admin';

    this.api.put(`chat/${orderId}/seen`, { viewerRole: userRole }).subscribe({
      next: () => { },
      error: (err) => console.error('Failed to mark as seen', err)
    });
  }

  sendChatMessage() {
    if (!this.newChatMessage.trim()) return;

    const orderId = this.selectedChatOrder()?._id;
    if (!orderId) return;

    const content = this.newChatMessage.trim();
    this.newChatMessage = ''; // Clear immediately

    let userRole = this.user()?.role || 'admin';

    this.api.post<any>(`chat/${orderId}`, {
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
        this.showToast('Failed to send message', 'error');
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

  getParsedDirectors(): any[] {
    const o = this.selectedChatOrder();
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
}
