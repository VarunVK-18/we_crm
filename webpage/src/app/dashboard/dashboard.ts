import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { Api } from '../api';
import { FormsModule } from '@angular/forms';

// Import subcomponents
import { HomeOverview } from './home-overview/home-overview';
import { ClientsDirectory } from './clients-directory/clients-directory';
import { EmployeesTeam } from './employees-team/employees-team';
import { FilingTasks } from './filing-tasks/filing-tasks';
import { ServiceChecklists } from './service-checklists/service-checklists';
import { AuditLogs } from './audit-logs/audit-logs';
import { SystemSettings } from './system-settings/system-settings';

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
    AuditLogs,
    SystemSettings
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  currentTab = signal<string>('dashboard');
  user = signal<any>(null);

  // Icon assets
  readonly Search01Icon = Search01Icon;

  // Mobile sidebar navigation drawer state
  isMobileSidebarOpen = signal<boolean>(false);

  constructor(private router: Router, private api: Api) {}

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
    } catch (e) {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update(val => !val);
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
    if (u.company_id && typeof u.company_id === 'object' && u.company_id.company_name) {
      return u.company_id.company_name;
    }
    return u.company_name || '';
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

  handleTabChanged(tabId: string) {
    this.currentTab.set(tabId);
  }

  getTabLabel(): string {
    switch (this.currentTab()) {
      case 'dashboard': return 'Dashboard';
      case 'clients': return 'Clients Directory';
      case 'team': return 'Employees & Team';
      case 'tasks': return 'Filing Tasks';
      case 'checklists': return 'Service Checklists';
      case 'logs': return 'System Audit Logs';
      case 'settings': return 'System Settings';
      default: return 'Dashboard';
    }
  }

  handleLogout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
