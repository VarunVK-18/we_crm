import { Component, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, UserAccountIcon, Notification01Icon, Rocket02Icon, GiftIcon, Briefcase02Icon, OfficeIcon, Briefcase01Icon, LicenseIcon, CalculatorIcon, Search01Icon, BankIcon, PercentIcon, Call02Icon, MailOpenIcon, ApartmentIcon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../components/we-loader/we-loader';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent, WeLoaderComponent],
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
  readonly ApartmentIcon = ApartmentIcon;
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
    return 1 + (this.activeOrders().length === 0 ? 1 : this.activeOrders().length);
  });

  constructor(private router: Router, public api: Api) {}

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
    
    const cachedManager = localStorage.getItem(`dashboard-manager-${uid}`);
    if (cachedManager) {
      try {
        this.clientManager.set(JSON.parse(cachedManager));
      } catch (e) {}
    }

    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res) => {
        let manager = null;
        if (res.user && res.user.client_manager) {
          manager = res.user.client_manager;
        } else if (res.user && res.user.assigned_to) {
          manager = res.user.assigned_to;
        }
        
        if (manager) {
          this.clientManager.set(manager);
          localStorage.setItem(`dashboard-manager-${uid}`, JSON.stringify(manager));
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

  downloadComplianceCalendar() {
    this.api.get<any>('calendar/latest').subscribe({
      next: (res) => {
        const docId = res?.calendar?.documentId?._id || res?.calendar?.documentId;
        if (docId) {
          const baseUrl = (this.api as any).baseUrl || 'http://localhost:5001/api';
          window.open(`${baseUrl}/documents/${docId}`, '_blank');
        } else {
          alert('Compliance Calendar not found.');
        }
      },
      error: (err) => {
        alert('Compliance Calendar for this year is not uploaded yet.');
      }
    });
  }

  goToServiceCategory(categoryId: string) {
    this.router.navigate(['/client/services'], { queryParams: { category: categoryId } });
  }

  processChecklists(checklists: any[]) {
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
        } else if (c.action_required) {
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
  }

  fetchOrders() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    
    const cachedData = localStorage.getItem(`dashboard-orders-${uid}`);
    if (cachedData) {
      try {
        const checklists = JSON.parse(cachedData);
        this.processChecklists(checklists);
      } catch (e) {
        // ignore JSON parse error
      }
    }
    
    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        localStorage.setItem(`dashboard-orders-${uid}`, JSON.stringify(checklists));
        this.processChecklists(checklists);
      },
      error: (err) => {
        console.error('Failed to fetch client orders:', err);
        if (!cachedData) {
          this.isLoading.set(false);
        }
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
