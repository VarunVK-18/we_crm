import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, Logout01Icon } from '@hugeicons/core-free-icons';

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
  readonly Logout01Icon = Logout01Icon;

  user = signal<any>(null);

  navGroups = [
    {
      header: '',
      items: [
        { id: 'dashboard', label: 'Dashboard', color: '#2563EB' },
        { id: 'clients', label: 'Clients', color: '#10B981' },
        { id: 'team', label: 'Employees', color: '#8B5CF6' }
      ]
    }
  ];

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
