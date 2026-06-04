import { Component, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, UserAccountIcon, Notification01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.css',
})
export class ClientDashboard implements OnInit, OnDestroy {
  readonly DashboardSquareRemoveIcon = DashboardSquareRemoveIcon;
  readonly UserAccountIcon = UserAccountIcon;
  readonly Notification01Icon = Notification01Icon;
  user = signal<any>(null);
  clientManager = signal<any>(null);
  
  // Orders
  allOrders = signal<any[]>([]);
  activeOrders = signal<any[]>([]);
  completedOrders = signal<any[]>([]);
  notInitializedOrders = signal<any[]>([]);
  
  // Computed stats
  totalOpenTasks = computed(() => {
    let count = 0;
    for (const order of this.activeOrders()) {
      if (order.items) {
        count += order.items.filter((i: any) => !i.isChecked).length;
      }
    }
    return count;
  });
  
  // UI State
  activeTab = signal<'active' | 'completed' | 'not-initialized'>('active');
  isLoading = signal(true);
  
  // Computed list for the current tab
  currentList = computed(() => {
    switch (this.activeTab()) {
      case 'active': return this.activeOrders();
      case 'completed': return this.completedOrders();
      case 'not-initialized': return this.notInitializedOrders();
      default: return [];
    }
  });
  
  pollingInterval: any;

  constructor(private router: Router, private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.role !== 'customer') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.user.set(parsedUser);
    
    this.fetchClientManager();
    this.fetchOrders();
    this.pollingInterval = setInterval(() => this.fetchOrders(), 4000);
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

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  setTab(tab: 'active' | 'completed' | 'not-initialized') {
    this.activeTab.set(tab);
  }

  goToProfile() {
    this.router.navigate(['/client/profile']);
  }

  fetchOrders() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    
    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        
        const active: any[] = [];
        const completed: any[] = [];
        const notInit: any[] = [];
        
        for (const c of checklists) {
          const isAssigned = c.assigned_to && c.assigned_to.role !== 'client_manager';
          let status = 'active';
          if (c.status === 'completed') {
            status = 'completed';
          } else if (!isAssigned) {
            status = 'not-initialized';
          }
          
          c.derivedStatus = status;
          
          if (status === 'active') active.push(c);
          else if (status === 'completed') completed.push(c);
          else notInit.push(c);
        }
        
        this.activeOrders.set(active);
        this.completedOrders.set(completed);
        this.notInitializedOrders.set(notInit);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch client orders:', err);
        this.isLoading.set(false);
      }
    });
  }

  openServiceDetails(order: any) {
    this.router.navigate([`/client/service/${order._id}`]);
  }

  getCompletedCount(items: any[] | undefined): number {
    if (!items) return 0;
    return items.filter(i => i.isChecked).length;
  }
}
