import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  currentTab = input<string>('dashboard');
  tabChanged = output<string>();
  logoutClicked = output<void>();

  readonly DashboardSquareRemoveIcon = DashboardSquareRemoveIcon;

  user = signal<any>(null);

  getNavGroups() {
    const u = this.user();
    if (!u) return [];

    const role = u.role;
    const items: any[] = [
      { id: 'dashboard', label: 'Dashboard', color: '#2563EB' }
    ];

    // ── Admin: full access ──────────────────────────────────
    if (role === 'admin') {
      items.push({ id: 'requests', label: 'New Requests', color: '#F43F5E' });
      items.push({ id: 'clients', label: 'Clients Directory', color: '#10B981' });
      items.push({ id: 'team', label: 'Employees & Team', color: '#8B5CF6' });
      items.push({ id: 'tasks', label: 'Filing Tasks', color: '#F59E0B' });
      items.push({ id: 'checklists', label: 'Checklists', color: '#06B6D4' });
      items.push({ id: 'completed-checklists', label: 'Completed Checklists', color: '#10B981' });
      items.push({ id: 'logs', label: 'Audit Logs', color: '#EC4899' });
      items.push({ id: 'settings', label: 'System Settings', color: '#6366F1' });

    // ── Client Manager: onboards clients, creates tasks/checklists ──
    } else if (role === 'client_manager') {
      items.push({ id: 'requests', label: 'New Requests', color: '#F43F5E' });
      items.push({ id: 'clients', label: 'My Clients', color: '#10B981' });
      items.push({ id: 'tasks', label: 'Filing Tasks', color: '#F59E0B' });
      items.push({ id: 'checklists', label: 'Checklists', color: '#06B6D4' });
      items.push({ id: 'completed-checklists', label: 'Completed Checklists', color: '#10B981' });

    // ── Filing Staff: sees assigned tasks & checklists ──────
    } else if (role === 'filling_staff') {
      items.push({ id: 'tasks', label: 'My Tasks', color: '#F59E0B' });
      items.push({ id: 'checklists', label: 'My Checklists', color: '#06B6D4' });
      items.push({ id: 'completed-checklists', label: 'Completed Checklists', color: '#10B981' });

    // ── Account Manager: same as filing staff ───────────────
    } else if (role === 'account_manager') {
      items.push({ id: 'tasks', label: 'My Tasks', color: '#F59E0B' });
      items.push({ id: 'checklists', label: 'My Checklists', color: '#06B6D4' });
      items.push({ id: 'completed-checklists', label: 'Completed Checklists', color: '#10B981' });
    }

    return [{ header: '', items }];
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
