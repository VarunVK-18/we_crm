import { Component, input, output, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, ChatNotificationIcon, Bookmark02Icon, FileValidationIcon, WorkHistoryIcon, UserMultiple02Icon, UserAccountIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
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

  user = signal<any>(null);

  constructor() {
    effect(() => {
      const tab = this.currentTab();
      if (tab === 'service-track') {
        if (!this.isCollapsed()) {
          this.isCollapsed.set(true);
          this.autoCollapsedForServiceTrack = true;
        }
      } else {
        if (this.autoCollapsedForServiceTrack) {
          this.isCollapsed.set(false);
          this.autoCollapsedForServiceTrack = false;
        }
      }
    }, { allowSignalWrites: true });
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
          { id: 'requests', label: 'New Requests', color: '#F43F5E' },
          { id: 'tasks', label: 'Custom Task', color: '#F59E0B' },
          { id: 'checklists', label: 'Ongoing Services', color: '#06B6D4' },
          { id: 'service-track', label: 'Service Track', color: '#8B5CF6' },
          { id: 'staff-compliance', label: 'Compliance Radar', color: '#3B82F6' },
          { id: 'completed-checklists', label: 'Completed Service', color: '#10B981' }
        ]
      });
      groups.push({
        header: 'Management',
        items: [
          { id: 'clients', label: 'Clients Directory', color: '#10B981' },
          { id: 'team', label: 'Employees & Team', color: '#8B5CF6' }
        ]
      });
      groups.push({
        header: 'System',
        items: [
          { id: 'logs', label: 'Audit Logs', color: '#EC4899' },
          { id: 'settings', label: 'System Settings', color: '#6366F1' }
        ]
      });
    } else if (role === 'client_manager') {
      groups.push({
        header: 'Operations',
        items: [
          { id: 'requests', label: 'New Requests', color: '#F43F5E' },
          { id: 'tasks', label: 'Custom Task', color: '#F59E0B' },
          { id: 'checklists', label: 'Ongoing Services', color: '#06B6D4' },
          { id: 'staff-compliance', label: 'Compliance Radar', color: '#3B82F6' },
          { id: 'completed-checklists', label: 'Completed Service', color: '#10B981' }
        ]
      });
      groups.push({
        header: 'Management',
        items: [
          { id: 'clients', label: 'My Clients', color: '#10B981' }
        ]
      });
    } else if (role === 'filling_staff' || role === 'account_manager') {
      groups.push({
        header: 'Operations',
        items: [
          { id: 'tasks', label: 'Custom Task', color: '#F59E0B' },
          { id: 'checklists', label: 'Ongoing Services', color: '#06B6D4' },
          { id: 'staff-compliance', label: 'Compliance Radar', color: '#3B82F6' },
          { id: 'completed-checklists', label: 'Completed Service', color: '#10B981' }
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
