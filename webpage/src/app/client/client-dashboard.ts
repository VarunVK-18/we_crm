import { Component, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, UserAccountIcon, Notification01Icon, Rocket02Icon, GiftIcon, Briefcase02Icon, OfficeIcon, Briefcase01Icon, LicenseIcon, CalculatorIcon, Search01Icon, BankIcon, PercentIcon, Call02Icon, MailOpenIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.css',
})
export class ClientDashboard implements OnInit, OnDestroy {
  readonly DashboardSquareRemoveIcon = DashboardSquareRemoveIcon;
  readonly Call02Icon = Call02Icon;
  readonly MailOpenIcon = MailOpenIcon;
  readonly UserAccountIcon = UserAccountIcon;
  readonly Notification01Icon = Notification01Icon;
  readonly Rocket02Icon = Rocket02Icon;
  readonly GiftIcon = GiftIcon;
  readonly Briefcase02Icon = Briefcase02Icon;
  readonly OfficeIcon = OfficeIcon;
  readonly Briefcase01Icon = Briefcase01Icon;
  readonly LicenseIcon = LicenseIcon;
  readonly CalculatorIcon = CalculatorIcon;
  readonly Search01Icon = Search01Icon;
  readonly BankIcon = BankIcon;
  readonly PercentIcon = PercentIcon;
  user = signal<any>(null);
  clientManager = signal<any>(null);
  
  // Orders
  allOrders = signal<any[]>([]);
  activeOrders = signal<any[]>([]);
  completedOrders = signal<any[]>([]);
  pendingOrders = signal<any[]>([]);
  
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
  activeTab = signal<'active' | 'completed' | 'pending-request'>('active');
  isLoading = signal(true);
  
  // Computed list for the current tab
  currentList = computed(() => {
    switch (this.activeTab()) {
      case 'active': return this.activeOrders();
      case 'completed': return this.completedOrders();
      case 'pending-request': return this.pendingOrders();
      default: return [];
    }
  });
  
  pollingInterval: any;

  // Carousel logic
  currentSlideIndex = signal<number>(0);
  sliderInterval: any;
  totalSlides = computed(() => {
    return 2 + (this.activeOrders().length === 0 ? 1 : this.activeOrders().length);
  });

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
    this.startSlider();
  }

  startSlider() {
    if (this.sliderInterval) clearInterval(this.sliderInterval);
    this.sliderInterval = setInterval(() => {
      this.currentSlideIndex.set((this.currentSlideIndex() + 1) % this.totalSlides());
    }, 3500);
  }

  setSlide(index: number) {
    this.currentSlideIndex.set(index);
    this.startSlider(); // reset timer
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
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  setTab(tab: 'active' | 'completed' | 'pending-request') {
    this.activeTab.set(tab);
  }

  goToProfile() {
    this.router.navigate(['/client/profile']);
  }

  goToGstCalc() {
    this.router.navigate(['/client/tools/gst-calc']);
  }

  goToNicFinder() {
    this.router.navigate(['/client/tools/nic-finder']);
  }

  goToTdsCalc() {
    this.router.navigate(['/client/tools/tds-calc']);
  }

  goToServiceCategory(categoryId: string) {
    this.router.navigate(['/client/services'], { queryParams: { category: categoryId } });
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
          let status = 'in-progress';
          if (c.status === 'completed') {
            status = 'completed';
          } else if (!isAssigned) {
            status = 'pending-request';
          } else {
            const isPrivateLimited = c.service_name === 'Private Limited Incorporation';
            const isLLP = c.service_name === 'LLP Incorporation';
            const isFSSAI = c.service_name === 'FSSAI Food License';
            
            if (isPrivateLimited && (!c.details || !c.details.companyName)) {
              status = 'action-required';
            } else if (isLLP && (!c.details || !c.details.llpName)) {
              status = 'action-required';
            } else if (isFSSAI && (!c.details || !c.details.fssai_business_type)) {
              status = 'action-required';
            }
          }
          
          c.derivedStatus = status;
          
          if (status === 'action-required' || status === 'in-progress' || status === 'active') active.push(c);
          else if (status === 'completed') completed.push(c);
          else notInit.push(c);
        }
        
        this.activeOrders.set(active);
        this.completedOrders.set(completed);
        this.pendingOrders.set(notInit);
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
