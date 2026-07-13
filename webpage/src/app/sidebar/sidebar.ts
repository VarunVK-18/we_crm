import { Component, input, output, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, ChatNotificationIcon, Bookmark02Icon, FileValidationIcon, WorkHistoryIcon, UserMultiple02Icon, UserAccountIcon, Search01Icon, Message02Icon, Settings01Icon, TrendingUpDownIcon, Key01Icon } from '@hugeicons/core-free-icons';
import { Api } from '../api';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  isCollapsed = signal<boolean>(false);
  autoCollapsedForServiceTrack = false;
  currentTab = input<string>('dashboard');
  tabChanged = output<string>();
  logoutClicked = output<void>();

  readonly DashboardSquareRemoveIcon = DashboardSquareRemoveIcon;
  readonly ChatNotificationIcon = ChatNotificationIcon;
  readonly UserMultiple02Icon = UserMultiple02Icon;
  readonly UserAccountIcon = UserAccountIcon;
  readonly BookMarkedIcon = Bookmark02Icon;
  readonly FileValidationIcon = FileValidationIcon;
  readonly HistoryIcon = WorkHistoryIcon;
  readonly Search01Icon = Search01Icon;
  readonly Message02Icon = Message02Icon;
  readonly Settings01Icon = Settings01Icon;
  readonly TrendingUpDownIcon = TrendingUpDownIcon;
  readonly Key01Icon = Key01Icon;

  user = signal<any>(null);
  newRequestsCount = signal<number>(0);
  bucketCount = signal<number>(0);
  unreadChatCount = signal<number>(0);
  private pollInterval: any;

  constructor(private api: Api) {
    // Auto-collapse logic removed as per user request
  }

  getNavGroups() {
    const u = this.user();
    if (!u) return [];

    const role = u.role;
    const groups: { header: string; items: any[] }[] = [];

    // All roles get Dashboard
    groups.push({
      header: 'Overview',
      items: [{ id: 'dashboard', label: 'Dashboard', color: '#2563EB' }]
    });

    if (role === 'admin') {
      groups.push({
        header: 'Operations',
        items: [
          { id: 'bucket', label: 'New Requests', color: '#6366f1' },
          { id: 'requests', label: 'New Services', color: '#F43F5E' },
          { id: 'checklists', label: 'Ongoing Services', color: '#06B6D4' },
          { id: 'staff-chat', label: 'Chat', color: '#10B981' },
          { id: 'service-track', label: 'Service Kanban', color: '#8B5CF6' },
          { id: 'service-tracker-table', label: 'Service Tracker Table', color: '#4F46E5' },
          { id: 'staff-compliance', label: 'Compliance Radar', color: '#3B82F6' },
          { id: 'payment-tracker', label: 'Reimbursement', color: '#10B981' }
        ]
      });
      groups.push({
        header: 'Management',
        items: [
          { id: 'clients', label: 'Clients Directory', color: '#10B981' },
          { id: 'team', label: 'Employees & Team', color: '#8B5CF6' },
          { id: 'team-service-track', label: 'Team Service Track', color: '#3B82F6' },
          { id: 'opportunities', label: 'Opportunities', color: '#F59E0B' }
        ]
      });
      groups.push({
        header: 'System',
        items: [
          { id: 'dsc-tokens', label: 'DSC Tokens', color: '#10B981' },
          { id: 'banners', label: 'Banner Management', color: '#F59E0B' },
          { id: 'logs', label: 'Audit Logs', color: '#EC4899' },
          { id: 'settings', label: 'System Settings', color: '#6366F1' }
        ]
      });
    } else if (role === 'client_manager') {
      groups.push({
        header: 'Operations',
        items: [
          { id: 'bucket', label: 'New Requests', color: '#6366f1' },
          { id: 'requests', label: 'New Services', color: '#F43F5E' },
          { id: 'checklists', label: 'Ongoing Services', color: '#06B6D4' },
          { id: 'staff-chat', label: 'Chat', color: '#10B981' },
          { id: 'service-tracker-table', label: 'Service Tracker Table', color: '#4F46E5' },
          { id: 'staff-compliance', label: 'Compliance Radar', color: '#3B82F6' },
          { id: 'payment-tracker', label: 'Reimbursement', color: '#10B981' }
        ]
      });
      groups.push({
        header: 'Management',
        items: [
          { id: 'clients', label: 'My Clients', color: '#10B981' },
          { id: 'team-service-track', label: 'Team Service Track', color: '#3B82F6' },
          { id: 'opportunities', label: 'Opportunities', color: '#F59E0B' }
        ]
      });
    } else if (role === 'filling_staff' || role === 'account_manager') {
      groups.push({
        header: 'Operations',
        items: [
          { id: 'bucket', label: 'Service Request', color: '#6366f1' },
          { id: 'checklists', label: 'Ongoing Services', color: '#06B6D4' },
          { id: 'staff-chat', label: 'Chat', color: '#10B981' },
          { id: 'staff-compliance', label: 'Compliance Radar', color: '#3B82F6' },
          { id: 'payment-tracker', label: 'Reimbursement', color: '#10B981' }
        ]
      });
    }

    return groups;
  }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.user.set(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage:', e);
      }
    }

    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.isCollapsed.set(savedState === 'true');
    }

    this.fetchNewRequestsCount();
    this.fetchBucketCount();
    this.fetchUnreadChatCount();
    this.pollInterval = setInterval(() => {
      this.fetchNewRequestsCount();
      this.fetchBucketCount();
      this.fetchUnreadChatCount();
    }, 15000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  getCompanyId(): string | null {
    const u = this.user();
    if (!u) return null;
    if (u.company_id && typeof u.company_id === 'object') {
      return u.company_id._id || null;
    }
    return u.company_id || null;
  }

  fetchNewRequestsCount() {
    const u = this.user();
    if (!u || (u.role !== 'admin' && u.role !== 'client_manager')) return;

    const companyId = this.getCompanyId();
    if (!companyId) return;

    this.api.get<any>(`orders/company/${companyId}`).subscribe({
      next: (res) => {
        if (res && res.orders) {
          const NEW_STATUSES = ['new', 'pending'];
          const NEW_STAGES = ['reqreceived', 'quot pending', 'quotepending'];
          const count = res.orders.filter((o: any) => {
            const status = (o.status || '').toLowerCase();
            const stage = (o.stage || '').toLowerCase();
            return NEW_STATUSES.includes(status) || NEW_STAGES.includes(stage);
          }).length;
          this.newRequestsCount.set(count);
        }
      },
      error: () => { }
    });
  }

  fetchBucketCount() {
    const u = this.user();
    if (!u) return;
    const role = u.role;
    if (!['admin', 'client_manager', 'filling_staff', 'account_manager'].includes(role)) return;

    this.api.get<any>('bucket/count').subscribe({
      next: (res) => {
        if (res && typeof res.count === 'number') {
          this.bucketCount.set(res.count);
        }
      },
      error: () => { }
    });
  }

  fetchUnreadChatCount() {
    const u = this.user();
    if (!u) return;
    
    this.api.get<any>('chat/conversations/unread-count').subscribe({
      next: (res) => {
        if (res && typeof res.count === 'number') {
          this.unreadChatCount.set(res.count);
        }
      },
      error: () => { }
    });
  }

  toggleCollapse() {
    const newState = !this.isCollapsed();
    this.isCollapsed.set(newState);
    this.autoCollapsedForServiceTrack = false;
    localStorage.setItem('sidebarCollapsed', newState.toString());
  }

  getInitials(): string {
    const name = this.user()?.owner_name || 'User';
    return name.charAt(0).toUpperCase();
  }

  selectTab(tabId: string) {
    this.tabChanged.emit(tabId);
  }

  logout() {
    this.logoutClicked.emit();
  }
}
