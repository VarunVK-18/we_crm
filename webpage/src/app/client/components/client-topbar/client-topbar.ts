import { Component, OnInit, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Notification01Icon, UserAccountIcon, Logout01Icon, ArrowDown01Icon, ArrowUp01Icon, Message02Icon } from '@hugeicons/core-free-icons';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationService, Notification } from '../../services/notification.service';
import { Api } from '../../../api';
import { ConfirmDialogService } from '../../../confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-client-topbar',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './client-topbar.html',
  styleUrl: './client-topbar.css'
})
export class ClientTopbarComponent implements OnInit {
  readonly Notification01Icon = Notification01Icon;
  readonly UserAccountIcon = UserAccountIcon;
  readonly Logout01Icon = Logout01Icon;
  readonly ArrowDown01Icon = ArrowDown01Icon;
  readonly ArrowUp01Icon = ArrowUp01Icon;
  readonly Message02Icon = Message02Icon;

  user = signal<any>(null);
  pageTitle = signal('My Services');
  pageSubtitle = signal('Client Portal Dashboard');
  navigationTrail = signal<{label: string, path?: string}[]>([]);
  breadcrumbs = signal<{label: string, path?: string}[]>([]);
  isDropdownOpen = signal(false);
  isNotificationOpen = signal(false);
  isEntityDropdownOpen = signal(false);

  // Entity switcher state (shared via localStorage so all pages react)
  availableEntities = signal<string[]>([]);
  selectedEntity = signal<string>(localStorage.getItem('client_selected_entity') || '');

  constructor(
    private router: Router, 
    private eRef: ElementRef, 
    public notifService: NotificationService,
    public api: Api,
    private confirmDialog: ConfirmDialogService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateTitle(event.urlAfterRedirects);
    });
  }

  ngOnInit() {
    this.fetchEntities();
    this.notifService.startPolling();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      this.user.set(parsedUser);
      
      // Fetch latest profile to keep topbar and local storage in sync with mobile updates
      const uid = parsedUser._id || parsedUser.id;
      if (uid) {
        this.api.get<any>(`users/profile/${uid}`).subscribe({
          next: (res: any) => {
            if (res.user) {
              this.user.set(res.user);
              localStorage.setItem('user', JSON.stringify(res.user));
            }
          },
          error: (err) => console.error('Failed to sync profile', err)
        });
      }
    }
    
    // Listen for cross-component entity changes
    window.addEventListener('entityChanged', (e: any) => {
      if (e.detail && e.detail !== this.selectedEntity()) {
        this.selectedEntity.set(e.detail);
      }
    });

    // Initialize title based on current url
    this.updateTitle(this.router.url);
  }

  get displayName(): string {
    const u = this.user();
    if (!u) return 'Company Name';
    
    const sel = this.selectedEntity();
    if (sel && sel !== 'All') {
      return sel;
    }
    return u.company_name || u.owner_name || u.name || 'Company Name';
  }

  fetchEntities() {
    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists: any[] = res.checklists || [];
        const entitySet = new Set<string>();
        checklists.forEach((c: any) => {
          const name = (
            c.entityName ||
            c.companyName ||
            c.details?.entityName ||
            c.details?.companyName ||
            c.details?.proposed_company_name ||
            c.details?.businessName ||
            c.details?.entity_name ||
            ''
          ).trim();
          if (name && name.toLowerCase() !== 'client') {
            entitySet.add(name);
          }
        });
        const entities = Array.from(entitySet).sort();
        this.availableEntities.set(entities);

        // Validate saved selection still exists
        const saved = localStorage.getItem('client_selected_entity');
        if (entities.length > 0) {
          if (!saved || saved === 'All' || !entitySet.has(saved)) {
            this.selectedEntity.set(entities[0]);
            localStorage.setItem('client_selected_entity', entities[0]);
            window.dispatchEvent(new CustomEvent('entityChanged', { detail: entities[0] }));
          } else {
            this.selectedEntity.set(saved);
          }
        }
      },
      error: (err) => console.error('Failed to fetch entities for switcher', err)
    });
  }

  async selectEntity(name: string) {
    this.isEntityDropdownOpen.set(false);
    const confirmed = await this.confirmDialog.confirm({
      title: 'Change Active Entity',
      message: `Are you sure you want to switch the active entity to "${name}"? Your dashboard data will be refreshed to reflect this change.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      this.selectedEntity.set(name);
      localStorage.setItem('client_selected_entity', name);
      // Dispatch a custom event so other components can react immediately
      window.dispatchEvent(new CustomEvent('entityChanged', { detail: name }));
    }
  }

  toggleEntityDropdown() {
    this.isEntityDropdownOpen.update(v => !v);
    this.isDropdownOpen.set(false);
    this.isNotificationOpen.set(false);
  }

  ngOnDestroy() {
    this.notifService.stopPolling();
  }

  updateTitle(url: string) {
    let trail: {label: string, path?: string}[] = [];
    
    if (url.includes('/dashboard')) {
      trail = [{ label: 'Dashboard' }];
      this.pageSubtitle.set('Stay updated with your business activities.');
    } else {
      trail.push({ label: 'Dashboard', path: '/client/dashboard' });
      
      if (url.includes('/profile')) {
        trail.push({ label: 'My Profile' });
        this.pageSubtitle.set('Account Details & Documents');
      } else if (url.includes('/service/')) {
        trail.push({ label: 'Service Details' });
        this.pageSubtitle.set('Track your request progress');
      } else if (url.includes('/compliance')) {
        trail.push({ label: 'Compliance' });
        const usr = this.user();
        this.pageSubtitle.set('Track Your Compliance and Upcoming Deadlines');
      } else if (url.includes('/tools/nic-finder')) {
        trail.push({ label: 'NIC code finder' });
        this.pageSubtitle.set('Search correct National Industrial Classification (NIC) Code for your business.');
      } else if (url.includes('/tools/compliance-calendar')) {
        trail.push({ label: 'Compliance calendar' });
        this.pageSubtitle.set('View upcoming compliance deadlines and forms.');
      } else if (url.includes('/tools/trademark-finder')) {
        trail.push({ label: 'Trademark class finder' });
        this.pageSubtitle.set('Search and find the correct TradeMark Class for your goods or services.');
      } else if (url.includes('/ongoing-services')) {
        trail.push({ label: 'My Services' });
        this.pageSubtitle.set('Track your active requests');
      } else if (url.includes('/services')) {
        trail.push({ label: 'Services' });
        this.pageSubtitle.set('Explore available services');
      } else if (url.includes('/subscriptions')) {
        trail.push({ label: 'Subscriptions' });
        this.pageSubtitle.set('Manage your subscription plans');
      } else if (url.includes('/support-tickets')) {
        trail.push({ label: 'Support Tickets' });
        this.pageSubtitle.set('View and manage your support requests');
      } else if (url.includes('/document-hub')) {
        trail.push({ label: 'Document Hub' });
        this.pageSubtitle.set('Manage and securely share your files');
      } else if (url.includes('/company-details')) {
        trail.push({ label: 'Company Details' });
        this.pageSubtitle.set('View and edit your company information');
      } else if (url.includes('/support')) {
        trail.push({ label: 'Help & Support' });
        this.pageSubtitle.set('Get assistance and find answers');
      } else {
        trail.push({ label: 'Overview' });
        this.pageSubtitle.set('Client Portal Dashboard');
      }
    }
    
    this.navigationTrail.set(trail);
  }

  navigateTo(path?: string) {
    if (path) {
      this.router.navigate([path]);
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
      this.isNotificationOpen.set(false);
      this.isEntityDropdownOpen.set(false);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
    this.isNotificationOpen.set(false);
    this.isEntityDropdownOpen.set(false);
  }

  toggleNotifications() {
    this.isNotificationOpen.update(v => !v);
    this.isDropdownOpen.set(false);
    this.isEntityDropdownOpen.set(false);
    if (this.isNotificationOpen()) {
      this.notifService.markAllAsRead();
    }
  }

  async confirmClearAll() {
    if (this.notifService.notifications().length === 0) {
      await this.confirmDialog.confirm({
        title: 'Nothing to clear',
        message: 'There are no recent updates to clear.',
        confirmText: 'OK',
        hideCancel: true
      });
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Clear All Notifications',
      message: 'Are you sure you want to clear all your notifications?',
      confirmText: 'Clear All',
      isDestructive: true
    });
    if (confirmed) {
      this.notifService.clearAll();
    }
  }

  async confirmClearNotification(id: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const confirmed = await this.confirmDialog.confirm({
      title: 'Clear Notification',
      message: 'Are you sure you want to dismiss this notification?',
      confirmText: 'Dismiss',
      isDestructive: true
    });
    if (confirmed) {
      this.notifService.clearNotification(id);
    }
  }

  handleNotificationClick(notification: Notification) {
    if (notification.type === 'chat' && notification.orderId) {
      this.isNotificationOpen.set(false);
      this.router.navigate(['/client/service', notification.orderId]);
    } else if (notification.type === 'document_request' && notification.orderId) {
      // Trigger file picker
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.jpg,.jpeg,.png';
      fileInput.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          this.uploadDocument(file, notification.orderId!);
        }
      };
      fileInput.click();
    }
  }

  uploadDocument(file: File, orderId: string) {
    const formData = new FormData();
    formData.append('document', file);
    
    // Checklists upload logic matches crm_backend routes
    this.api.post(`checklists/${orderId}/upload-documents`, formData).subscribe({
      next: () => {
        alert('Document uploaded successfully!');
        this.notifService.fetchNotifications();
      },
      error: (err) => {
        console.error('Failed to upload document', err);
        alert('Failed to upload document. Please try again.');
      }
    });
  }

  formatTime(timeStr: string): string {
    const time = new Date(timeStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - time.getTime()) / 60000); // in minutes
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  async logout() {
    const choice = await this.confirmDialog.confirm({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      isDestructive: true
    });
    
    if (choice) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('client_selected_entity');
      this.router.navigate(['/login']);
    }
  }

  getInitials(name: string): string {
    if (!name || name.trim().length === 0) return 'C';
    return name.trim().substring(0, 1).toUpperCase();
  }
}
