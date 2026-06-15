import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { NotificationService } from '../client/services/notification.service';
import { Notification01Icon, Search01Icon, Message02Icon } from '@hugeicons/core-free-icons';
import { Api } from '../api';
import { FormsModule } from '@angular/forms';

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
    EmployeeProfile
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  currentTab = signal<string>('dashboard');
  selectedClientId = signal<string | null>(null);
  selectedChecklistId = signal<string | null>(null);
  selectedEmployeeObj = signal<any>(null);
  openChatOnLoad = signal<boolean>(false);
  user = signal<any>(null);
  teams = signal<any[]>([]);
  navigationTrail = signal<{label: string, action: () => void}[]>([]);

  // Icon assets
  readonly Search01Icon = Search01Icon;
  readonly Notification01Icon = Notification01Icon;
  readonly Message02Icon = Message02Icon;

  // Mobile sidebar navigation drawer state
  isMobileSidebarOpen = signal<boolean>(false);
  isNotificationOpen = signal<boolean>(false);
  isProfileDropdownOpen = signal<boolean>(false);

  constructor(private router: Router, private api: Api, public notifService: NotificationService) {}

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
      this.viewChecklist(notif.orderId, true);
    } else if (notif.orderId) {
      this.viewChecklist(notif.orderId, false);
    }
    
    this.isNotificationOpen.set(false);
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
    if (tab === 'clients') this.selectedClientId.set(null);
    if (tab === 'team') this.selectedEmployeeObj.set(null);
    
    // Reset breadcrumb trail for top-level navigation
    this.navigationTrail.set([
      { label: this.getTabLabel(tab), action: () => this.handleTabChanged(tab) }
    ]);
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

  viewChecklist(checklistId: string, openChat: boolean = false) {
    this.selectedChecklistId.set(checklistId);
    this.openChatOnLoad.set(openChat);
    this.currentTab.set('checklist-details');
    this.navigationTrail.update(trail => [
      ...trail,
      { label: 'Checklist Details', action: () => this.viewChecklist(checklistId, openChat) }
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
      case 'checklists': return 'Compliance';
      case 'completed-checklists': return 'Completed Service';
      case 'checklist-details': return 'Checklist Details';
      case 'requests': return 'New Requests';
      case 'logs': return 'System Audit Logs';
      case 'settings': return 'System Settings';
      case 'staff-compliance': return 'Staff Compliance Radar';
      default: return 'Dashboard';
    }
  }

  handleLogout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
