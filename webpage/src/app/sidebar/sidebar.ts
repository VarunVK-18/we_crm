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

    const items = [
      { id: 'dashboard', label: 'Dashboard', color: '#2563EB' }
    ];

    const role = u.role;
    
    // Add Clients (scoped role-based label)
    if (role === 'sales_staff') {
      items.push({ id: 'clients', label: 'Leads & Prospects', color: '#10B981' });
    } else {
      items.push({ id: 'clients', label: 'Clients Directory', color: '#10B981' });
    }

    // Add Employees (Admin only)
    if (role === 'admin') {
      items.push({ id: 'team', label: 'Employees & Team', color: '#8B5CF6' });
    }

    // Add Filing Tasks (Admin, Auditor, Account Manager, Filling Staff, Sales Staff, Agent)
    if (role !== 'customer') {
      items.push({ id: 'tasks', label: 'Filing Tasks', color: '#F59E0B' });
    }

    // Add Audit Logs (Admin, Auditor)
    if (role === 'admin' || role === 'auditor') {
      items.push({ id: 'logs', label: 'Audit Logs', color: '#EC4899' });
    }

    // Add Settings (Admin, Auditor)
    if (role === 'admin' || role === 'auditor') {
      items.push({ id: 'settings', label: 'System Settings', color: '#6366F1' });
    }

    return [
      {
        header: '',
        items
      }
    ];
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
