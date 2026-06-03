import { Component, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../api';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.css',
})
export class ClientDashboard implements OnInit, OnDestroy {
  user = signal<any>(null);
  
  // Orders
  allOrders = signal<any[]>([]);
  activeOrders = signal<any[]>([]);
  completedOrders = signal<any[]>([]);
  notInitializedOrders = signal<any[]>([]);
  
  // UI State
  activeTab = signal<'active' | 'completed' | 'not-initialized'>('active');
  isLoading = signal(true);
  
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
    
    this.fetchOrders();
    this.pollingInterval = setInterval(() => this.fetchOrders(), 4000);
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
