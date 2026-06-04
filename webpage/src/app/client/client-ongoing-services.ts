import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../api';

@Component({
  selector: 'app-client-ongoing-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-ongoing-services.html',
  styleUrl: './client-ongoing-services.css',
})
export class ClientOngoingServices implements OnInit, OnDestroy {
  user = signal<any>(null);
  activeOrders = signal<any[]>([]);
  isLoading = signal(true);
  pollingInterval: any;

  constructor(private router: Router, private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.user.set(JSON.parse(savedUser));
    
    this.fetchOrders();
    this.pollingInterval = setInterval(() => this.fetchOrders(), 4000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  fetchOrders() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    
    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        const active: any[] = [];
        
        for (const c of checklists) {
          const isAssigned = c.assigned_to && c.assigned_to.role !== 'client_manager';
          if (c.status !== 'completed' && isAssigned) {
            c.derivedStatus = 'active';
            active.push(c);
          }
        }
        
        this.activeOrders.set(active);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching orders', err);
        this.isLoading.set(false);
      }
    });
  }

  getCompletedCount(items: any[]): number {
    if (!items) return 0;
    return items.filter(i => i.isChecked).length;
  }

  openServiceDetails(order: any) {
    this.router.navigate(['/client/service', order._id || order.id]);
  }
}
