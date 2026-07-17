import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, UserAccountIcon, Notification01Icon, Rocket02Icon, GiftIcon, Briefcase02Icon, OfficeIcon, Briefcase01Icon, LicenseIcon, CalculatorIcon, Search01Icon, BankIcon, PercentIcon, Call02Icon, MailOpenIcon, ApartmentIcon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../components/we-loader/we-loader';
import confetti from 'canvas-confetti';

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
  
  // Ticket stats
  pendingTicketsCount = signal(0);

  // Compliance
  pendingTasks = signal<any[]>([]);
  healthScore = computed(() => {
    const pending = this.pendingTasks().filter(t => this.matchesEntity(t));
    if (pending.length === 0) return 1.0;
    
    let minScore = 0.9;
    for (const t of pending) {
      if (t.status === 'Overdue') minScore = Math.min(minScore, 0.25);
      else if (t.status === 'Critical') minScore = Math.min(minScore, 0.5);
      else if (t.status === 'Due Soon') minScore = Math.min(minScore, 0.75);
    }
    return minScore;
  });

  // Banners
  banners = signal<any[]>([]);

  // Entity filter (synced with topbar switcher via localStorage + custom event)
  selectedEntity = signal<string>(localStorage.getItem('client_selected_entity') || 'All');
  private entityChangeHandler = (e: Event) => {
    const name = (e as CustomEvent).detail as string;
    this.selectedEntity.set(name);
  };

  // Helper: resolve entity name from a checklist object
  private resolveEntityName(order: any): string {
    return (
      order.entityName ||
      order.companyName ||
      order.details?.entityName ||
      order.details?.companyName ||
      order.details?.proposed_company_name ||
      order.details?.businessName ||
      order.details?.entity_name ||
      ''
    ).trim();
  }

  private matchesEntity(order: any): boolean {
    const sel = this.selectedEntity();
    if (sel === 'All') return true;
    return this.resolveEntityName(order).toLowerCase() === sel.toLowerCase();
  }

  // Filtered computed lists
  filteredActiveOrders = computed(() => this.activeOrders().filter(o => this.matchesEntity(o)));
  filteredCompletedOrders = computed(() => this.completedOrders().filter(o => this.matchesEntity(o)));
  filteredPendingOrders = computed(() => this.pendingOrders().filter(o => this.matchesEntity(o)));
  filteredActionRequiredOrders = computed(() => this.activeOrders().filter(o => this.matchesEntity(o) && o.derivedStatus === 'action-required'));
  sliderOrders = computed(() => {
    const actionRequired = this.filteredActionRequiredOrders();
    if (actionRequired.length > 0) return actionRequired;
    return this.filteredActiveOrders();
  });
  
  // UI State
  activeTab = signal<'active' | 'completed' | 'pending-request'>('active');
  isLoading = signal(true);
  
  // Computed list for the current tab
  currentList = computed(() => {
    switch (this.activeTab()) {
      case 'active': return this.filteredActiveOrders();
      case 'completed': return this.filteredCompletedOrders();
      case 'pending-request': return this.filteredPendingOrders();
      default: return [];
    }
  });
  
  pollingInterval: any;

  // Carousel logic
  currentSlideIndex = signal<number>(0);
  sliderInterval: any;
  totalSlides = computed(() => {
    const defaultBanners = this.banners().length > 0 ? this.banners().length : 1;
    return defaultBanners + this.sliderOrders().length;
  });

  getSlideStyle(index: number) {
    const colors = ['#d7d98a', '#dcfce7', '#fef08a', '#bae6fd', '#e0f2fe', '#ccfbf1'];
    const bg = colors[index % colors.length];
    
    // Determine text color based on background luminance
    const hex = bg.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    const isLight = yiq >= 128;
    
    return {
      'background': bg,
      'color': isLight ? '#0f172a' : '#ffffff'
    };
  }

  constructor(private router: Router, public api: Api) {}

  showDownloadAppModal = signal(false);

  actionRequiredSlideIndex = signal<number>(0);
  actionRequiredInterval: any;

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.fetchBanners();

    const userData = JSON.parse(savedUser);
    
    this.actionRequiredInterval = setInterval(() => {
      const len = this.filteredActionRequiredOrders().length;
      if (len > 1) {
        this.actionRequiredSlideIndex.set((this.actionRequiredSlideIndex() + 1) % len);
      }
    }, 4000);

    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.role !== 'customer') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.user.set(parsedUser);
    
    // if (!parsedUser.isMobile) {
    //   this.showDownloadAppModal.set(true);
    //   sessionStorage.setItem('download_app_prompted', 'true');
    // }
    
    this.fetchBanners();
    this.fetchClientManager();
    this.fetchOrders();
    this.fetchTickets();
    this.fetchReminders();
    this.pollingInterval = setInterval(() => {
      this.fetchOrders();
      this.fetchTickets();
      this.fetchReminders();
    }, 4000);
    this.startSlider();
    window.addEventListener('entityChanged', this.entityChangeHandler);

    // TODO: Remove this after testing
    // setTimeout(() => {
    //   this.congratsServiceName.set('Test Service');
    //   this.showCongratsModal.set(true);
    //   confetti({
    //     particleCount: 150,
    //     spread: 70,
    //     origin: { y: 0.6 },
    //     zIndex: 10000
    //   });
    // }, 1000);
  }

  startSlider() {
    if (this.sliderInterval) clearInterval(this.sliderInterval);
    this.sliderInterval = setInterval(() => {
      this.currentSlideIndex.set((this.currentSlideIndex() + 1) % this.totalSlides());
    }, 3500);
  }

  closeDownloadAppModal() {
    this.showDownloadAppModal.set(false);
  }

  appLinkCopied = signal(false);

  showCongratsModal = signal(false);
  congratsServiceName = signal('');
  
  copyAppLink() {
    navigator.clipboard.writeText('https://play.google.com/store/apps').then(() => {
      this.appLinkCopied.set(true);
      setTimeout(() => this.appLinkCopied.set(false), 2000);
    });
  }

  stopSlider() {
    if (this.sliderInterval) clearInterval(this.sliderInterval);
  }

  setSlide(index: number) {
    this.currentSlideIndex.set(index);
    this.startSlider(); // reset timer
  }

  nextSlide(event?: Event) {
    if (event) event.stopPropagation();
    this.currentSlideIndex.set((this.currentSlideIndex() + 1) % this.totalSlides());
    this.startSlider(); // reset timer
  }

  prevSlide(event?: Event) {
    if (event) event.stopPropagation();
    const current = this.currentSlideIndex();
    const total = this.totalSlides();
    this.currentSlideIndex.set((current - 1 + total) % total);
    this.startSlider(); // reset timer
  }

  fetchBanners() {
    this.api.get<any>('banners').subscribe({
      next: (res) => {
        if (res.success && res.banners) {
          this.banners.set(res.banners);
        }
      },
      error: (err) => console.error('Failed to load banners:', err)
    });
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

  fetchTickets() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    
    this.api.get<any>(`tickets/user/${uid}`).subscribe({
      next: (res) => {
        if (res && res.tickets) {
          const pendingCount = res.tickets.filter((t: any) => t.status === 'Pending' || t.status === 'In Progress').length;
          this.pendingTicketsCount.set(pendingCount);
        }
      },
      error: (err) => console.error('Failed to fetch tickets:', err)
    });
  }

  fetchReminders() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;

    this.api.get<any>(`compliance/tasks/user/${uid}`).subscribe({
      next: (res) => {
        const fetched = res.tasks || [];
        const mapped = fetched.map((r: any) => {
          const entityName =
            r.entityName?.trim() ||
            (r.companyId && typeof r.companyId === 'object'
              ? r.companyId.company_name
              : null) ||
            r.checklistId?.details?.entityName ||
            r.checklistId?.details?.companyName ||
            r.checklistId?.details?.proposed_company_name ||
            r.checklistId?.details?.businessName ||
            'Individual';
          return { ...r, entityName };
        });
        this.pendingTasks.set(mapped);
      },
      error: (err) => console.error('Failed to fetch compliance tasks:', err)
    });
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
    window.removeEventListener('entityChanged', this.entityChangeHandler);
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

  goToComplianceCalendar() {
    this.router.navigate(['/client/tools/compliance-calendar']);
  }

  goToTdsCalc() {
    this.router.navigate(['/client/tools/tds-calc']);
  }

  goToTrademarkFinder() {
    this.router.navigate(['/client/tools/trademark-finder']);
  }

  goToServiceCategory(categoryId: string) {
    this.router.navigate(['/client/services'], { queryParams: { category: categoryId } });
  }

  processChecklists(checklists: any[]) {
    const active: any[] = [];
    const completed: any[] = [];
    const notInit: any[] = [];
    
    for (const c of checklists) {
      const isAssigned = !!c.assigned_to;
      let status = 'in-progress';
      if (c.status === 'completed') {
        status = 'completed';
      } else if (!isAssigned) {
        status = 'pending-request';
      } else {
        const needsDocUpload = c.requestedDocuments?.some((doc: any) => !doc.isUploaded);
        const clientFormSubmitted = c.details?.clientFormSubmitted === true;
        if (needsDocUpload || !clientFormSubmitted || c.action_required) {
          status = 'action-required';
        }
      }
      
      c.derivedStatus = status;
      
      if (status === 'action-required' || status === 'in-progress' || status === 'active') {
        active.push(c);
      } else if (status === 'completed') {
        completed.push(c);
        if (!this.showCongratsModal()) {
          const hasBeenCongratulated = localStorage.getItem(`congrats_shown_${c._id || c.id}`);
          if (!hasBeenCongratulated) {
            this.congratsServiceName.set(c.service_name || c.checklist_name || 'Service');
            this.showCongratsModal.set(true);
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              zIndex: 10000
            });
            localStorage.setItem(`congrats_shown_${c._id || c.id}`, 'true');
          }
        }
      } else {
        notInit.push(c);
      }
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

  closeCongratsModal() {
    this.showCongratsModal.set(false);
  }

  getCompletedCount(items: any[]): number {
    if (!items) return 0;
    return items.filter(i => i.isChecked).length;
  }

  getProgressPercentage(order: any): number {
    if (!order || !order.items || order.items.length === 0) return 0;
    return Math.round((this.getCompletedCount(order.items) / order.items.length) * 100);
  }
}
