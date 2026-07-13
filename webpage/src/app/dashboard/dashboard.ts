import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { NotificationService } from '../client/services/notification.service';
import { Notification01Icon, Search01Icon, Message02Icon, ChatNotificationIcon } from '@hugeicons/core-free-icons';
import { Api } from '../api';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';

// Import subcomponents
import { HomeOverview } from './home-overview/home-overview';
import { ClientsDirectory } from './clients-directory/clients-directory';
import { EmployeesTeam } from './employees-team/employees-team';
import { FilingTasks } from './filing-tasks/filing-tasks';
import { ServiceChecklists } from './service-checklists/service-checklists';
import { CompletedChecklists } from './completed-checklists/completed-checklists';
import { AuditLogs } from './audit-logs/audit-logs';
import { SystemSettings } from './system-settings/system-settings';
import { RequestsComponent } from './requests/requests';
import { ClientDashboard } from './client-dashboard/client-dashboard';
import { ChecklistDetails } from './checklist-details/checklist-details';
import { StaffCompliance } from './staff-compliance/staff-compliance';
import { EmployeeProfile } from './employee-profile/employee-profile';
import { PaymentTrackerComponent } from './payment-tracker/payment-tracker';
import { ServiceTrackComponent } from './service-track/service-track';
import { StaffChatComponent } from './staff-chat/staff-chat';
import { BannerManagement } from './banner-management/banner-management';
import { BucketComponent } from './bucket/bucket';
import { ServiceTrackerTableComponent } from './service-tracker-table/service-tracker-table';
import { TeamServiceTrackComponent } from './team-service-track/team-service-track';
import { Opportunities } from './opportunities/opportunities';
import { DscTokens } from './dsc-tokens/dsc-tokens';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    Sidebar, 
    HugeiconsIconComponent, 
    FormsModule,
    HomeOverview,
    ClientsDirectory,
    EmployeesTeam,
    FilingTasks,
    ServiceChecklists,
    CompletedChecklists,
    AuditLogs,
    SystemSettings,
    RequestsComponent,
    ClientDashboard,
    ChecklistDetails,
    StaffCompliance,
    EmployeeProfile,
    PaymentTrackerComponent,
    ServiceTrackComponent,
    StaffChatComponent,
    BannerManagement,
    BucketComponent,
    ServiceTrackerTableComponent,
    TeamServiceTrackComponent,
    Opportunities,
    DscTokens
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  currentTab = signal<string>('dashboard');
  selectedClientId = signal<string | null>(null);
  selectedChecklistId = signal<string | null>(null);
  selectedClientChatId = signal<string | null>(null);
  selectedEmployeeObj = signal<any>(null);
  openChatOnLoad = signal<boolean>(false);
  user = signal<any>(null);
  teams = signal<any[]>([]);
  navigationTrail = signal<{label: string, action: () => void}[]>([]);
  globalSearchQuery = signal<string>('');
  dscTokenBalance = signal<number>(0);
  lowDscTokenWarning = signal<boolean>(false);
  unreadChatCount = signal<number>(0);

  // Icon assets
  readonly Search01Icon = Search01Icon;
  readonly Notification01Icon = Notification01Icon;
  readonly Message02Icon = Message02Icon;
  readonly ChatNotificationIcon = ChatNotificationIcon;

  // Mobile sidebar navigation drawer state
  isMobileSidebarOpen = signal<boolean>(false);
  isNotificationOpen = signal<boolean>(false);
  isProfileDropdownOpen = signal<boolean>(false);

  constructor(private router: Router, public api: Api, public notifService: NotificationService, private confirmDialog: ConfirmDialogService) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role === 'customer') {
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
        return;
      }
      this.user.set(parsedUser);
      this.fetchTeams();
      this.notifService.startPolling();
      
      if (parsedUser.role === 'admin') {
        this.checkDscTokens();
        // Set an interval to periodically check DSC tokens (e.g., every 5 minutes)
        setInterval(() => this.checkDscTokens(), 300000);
      }

      this.fetchUnreadChatCount();
      setInterval(() => this.fetchUnreadChatCount(), 15000);

      // Initialize breadcrumb for the first load
      this.navigationTrail.set([{ label: this.getTabLabel('dashboard'), action: () => this.handleTabChanged('dashboard') }]);
    } catch (e) {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    this.notifService.stopPolling();
  }

  checkDscTokens() {
    this.api.get<any>('dsc-tokens/status').subscribe({
      next: (res) => {
        if (res && typeof res.availableTokens === 'number') {
          this.dscTokenBalance.set(res.availableTokens);
          const limit = res.warningLimit !== undefined ? res.warningLimit : 10;
          this.lowDscTokenWarning.set(res.availableTokens <= limit);
        }
      },
      error: (err) => console.error('Error fetching DSC tokens for warning', err)
    });
  }

  fetchUnreadChatCount() {
    const u = this.user();
    if (!u) return;
    
    this.api.get<any>('chat/conversations/unread-count').subscribe({
      next: (res) => {
        if (res && typeof res.mentionCount === 'number') {
          this.unreadChatCount.set(res.mentionCount);
        } else if (res && typeof res.count === 'number') {
          // Fallback if backend doesn't support mentionCount yet
          this.unreadChatCount.set(res.count);
        }
      },
      error: () => { }
    });
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update(val => !val);
  }

  toggleNotifications() {
    this.isNotificationOpen.update(val => !val);
    if (this.isNotificationOpen()) {
      this.notifService.markAllAsRead();
    }
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen.update(val => !val);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  }

  handleNotificationClick(notif: any) {
    // Default action for notification click
    if (notif.type === 'chat' && notif.orderId) {
      if (this.user()?.role === 'filling_staff') {
        this.selectedChecklistId.set(notif.orderId);
        this.handleTabChanged('staff-chat');
      } else {
        this.viewChecklist(notif.orderId, true);
      }
    } else if (notif.orderId) {
      this.viewChecklist(notif.orderId, false);
    }
    
    this.isNotificationOpen.set(false);
  }

  uploadProfilePhoto(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const u = this.user();
    if (!u) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    this.api.post<any>(`users/profile/${u._id || u.id}/upload-image`, formData).subscribe({
      next: (res) => {
        if (res.success && res.profile_image) {
          const updatedUser = { ...u, profile_image: res.profile_image };
          this.user.set(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          this.isProfileDropdownOpen.set(false);
        }
      },
      error: (err) => console.error('Failed to upload profile photo', err)
    });
  }

  fetchTeams() {
    const companyId = this.getCompanyId();
    if (!companyId) return;
    this.api.get<any>(`users/team-groups?company_id=${companyId}`).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.teams.set(res);
        } else if (res && res.success) {
          this.teams.set(res.groups || []);
        }
      }
    });
  }

  /** Returns the company_id string for the logged-in admin's company */
  getCompanyId(): string | null {
    const u = this.user();
    if (!u) return null;
    if (u.company_id && typeof u.company_id === 'object') {
      return u.company_id._id || null;
    }
    return u.company_id || null;
  }

  /** Returns the company display name */
  getCompanyName(): string {
    const u = this.user();
    if (!u) return '';
    return u.company_name || (u.company_id && typeof u.company_id === 'object' ? u.company_id.company_name : '');
  }

  /** Returns the company code */
  getCompanyCode(): string {
    const u = this.user();
    if (!u) return '';
    if (u.company_id && typeof u.company_id === 'object' && u.company_id.company_code) {
      return u.company_id.company_code;
    }
    return u.company_code || '';
  }

  getInitials(name?: string): string {
    const nameStr = name || this.user()?.owner_name || 'User';
    return nameStr.charAt(0).toUpperCase();
  }

  handleTabChanged(tab: string) {
    this.currentTab.set(tab);
    if (tab !== 'checklist-details' && tab !== 'staff-chat') {
      this.selectedChecklistId.set(null);
    }
    
    if (tab !== 'staff-chat') {
      this.selectedClientChatId.set(null);
    }
    
    if (tab === 'team') this.selectedEmployeeObj.set(null);
    
    // Reset breadcrumb trail for top-level navigation
    if (tab === 'dashboard') {
      this.navigationTrail.set([
        { label: this.getTabLabel(tab), action: () => this.handleTabChanged(tab) }
      ]);
    } else {
      this.navigationTrail.set([
        { label: this.getTabLabel('dashboard'), action: () => this.handleTabChanged('dashboard') },
        { label: this.getTabLabel(tab), action: () => this.handleTabChanged(tab) }
      ]);
    }
  }

  viewClient(clientId: string) {
    this.selectedClientId.set(clientId);
    this.currentTab.set('client-dashboard');
    this.navigationTrail.update(trail => [
      ...trail,
      { label: 'Client Profile Dashboard', action: () => this.viewClient(clientId) }
    ]);
  }

  viewEmployee(employee: any) {
    this.selectedEmployeeObj.set(employee);
    this.currentTab.set('employee-profile');
    this.navigationTrail.update(trail => [
      ...trail,
      { label: 'Employee Profile', action: () => this.viewEmployee(employee) }
    ]);
  }

  pushNavigation(label: string, action: () => void) {
    this.navigationTrail.update(trail => [
      ...trail,
      { label, action }
    ]);
  }

  openChecklistDetails(checklistId: string, clientName: string) {
    this.selectedChecklistId.set(checklistId);
    this.pushNavigation('Checklist Details', () => this.handleTabChanged('checklist-details'));
    this.handleTabChanged('checklist-details');
  }

  openClientChat(clientId: string) {
    this.selectedClientChatId.set(clientId);
    this.pushNavigation('Staff Chat', () => this.handleTabChanged('staff-chat'));
    this.handleTabChanged('staff-chat');
  }

  viewChecklist(checklistId: string, openChat: boolean = false) {
    this.selectedChecklistId.set(checklistId);
    this.openChatOnLoad.set(openChat);
    this.currentTab.set('checklist-details');
    this.navigationTrail.update(trail => [
      ...trail,
      { label: 'Service Details', action: () => this.viewChecklist(checklistId, openChat) }
    ]);
  }

  preselectedOpportunityClientId = signal<string>('');

  handleViewOpportunities(clientId: string) {
    this.preselectedOpportunityClientId.set(clientId);
    this.currentTab.set('opportunities');
    this.navigationTrail.set([
      { label: this.getTabLabel('dashboard'), action: () => this.handleTabChanged('dashboard') },
      { label: 'Opportunities', action: () => this.handleTabChanged('opportunities') }
    ]);
  }

  navigateToBreadcrumb(index: number) {
    const trail = this.navigationTrail();
    if (index >= 0 && index < trail.length) {
      const target = trail[index];
      // Slice the trail up to the clicked item (exclusive), 
      // because executing the target action will push itself back onto the trail.
      if (index === 0 && target.label === this.getTabLabel(this.currentTab())) {
        // If clicking the top-level tab and it's already active, do nothing
        if (trail.length === 1) return; 
      }
      this.navigationTrail.set(trail.slice(0, index));
      target.action();
    }
  }

  getTabLabel(tab: string = this.currentTab()): string {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'clients': return 'Clients Directory';
      case 'client-dashboard': return 'Client Profile Dashboard';
      case 'team': return 'Employees & Team';
      case 'employee-profile': return 'Employee Profile';
      case 'tasks': return 'Custom Task';
      case 'checklists': return 'Ongoing Service';
      case 'completed-checklists': return 'Completed Service';
      case 'checklist-details': return 'Service Details';
      case 'requests': return 'New Services';
      case 'logs': return 'System Audit Logs';
      case 'settings': return 'System Settings';
      case 'banners': return 'Banner Management';
      case 'staff-compliance': return 'Staff Compliance Radar';
      case 'bucket': return this.user()?.role === 'filling_staff' ? 'Service Request' : 'New Requests';
      case 'payment-tracker': return 'Reimbursement';
      case 'service-track': return 'Service Kanban';
      case 'service-tracker-table': return 'Service Tracker';
      case 'team-service-track': return 'Team Service Tracker';
      case 'opportunities': return 'Opportunities';
      case 'staff-chat': return 'Staff Chat';
      default: return 'Dashboard';
    }
  }

  async handleLogout() {
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
      this.router.navigate(['/login']);
    }
  }
}
