import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../api';
import { WeLoaderComponent } from '../components/we-loader/we-loader';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { ApartmentIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-ongoing-services',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, HugeiconsIconComponent],
  templateUrl: './client-ongoing-services.html',
  styleUrl: './client-ongoing-services.css',
})
export class ClientOngoingServices implements OnInit, OnDestroy {
  readonly ApartmentIcon = ApartmentIcon;
  user = signal<any>(null);
  clientManager = signal<any>(null);
  activeOrders = signal<any[]>([]);
  activeTab = signal<string>('All');
  searchQuery = signal<string>('');
  isLoading = signal(true);
  pollingInterval: any;

  // Entity filter — synced with topbar via custom event
  selectedEntity = signal<string>(localStorage.getItem('client_selected_entity') || 'All');
  private entityChangeHandler = (e: Event) => {
    this.selectedEntity.set((e as CustomEvent).detail as string);
  };

  constructor(private router: Router, public api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.user.set(JSON.parse(savedUser));
    
    this.fetchClientManager();
    this.fetchOrders();
    this.pollingInterval = setInterval(() => this.fetchOrders(), 4000);
    window.addEventListener('entityChanged', this.entityChangeHandler);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    window.removeEventListener('entityChanged', this.entityChangeHandler);
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
      error: (err) => console.error('Failed to fetch client manager', err)
    });
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
          if (isAssigned) {
            let status = c.status === 'completed' ? 'completed' : 'in-progress';
            
            if (status === 'in-progress') {
              if (c.action_required) {
                status = 'action-required';
              }
            }
            
            c.derivedStatus = status;
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

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  getFilteredOrders() {
    let orders = this.activeOrders();
    const tab = this.activeTab();
    
    if (tab === 'Action Required') {
      orders = orders.filter(o => o.derivedStatus === 'action-required');
    } else if (tab === 'In Progress') {
      orders = orders.filter(o => o.derivedStatus === 'in-progress' || o.derivedStatus === 'active');
    } else if (tab === 'Completed') {
      orders = orders.filter(o => o.derivedStatus === 'completed');
    }
    
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      orders = orders.filter(o => (o.service_name || o.checklist_name || '').toLowerCase().includes(query));
    }

    // Apply entity filter
    const sel = this.selectedEntity();
    if (sel !== 'All') {
      orders = orders.filter(o => {
        const name = (
          o.entityName || o.companyName ||
          o.details?.entityName || o.details?.companyName ||
          o.details?.proposed_company_name || o.details?.businessName ||
          o.details?.entity_name || ''
        ).trim();
        return name.toLowerCase() === sel.toLowerCase();
      });
    }
    
    return orders;
  }

  openServiceDetails(order: any) {
    this.router.navigate(['/client/service', order._id || order.id]);
  }
}
