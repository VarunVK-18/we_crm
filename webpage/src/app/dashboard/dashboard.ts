import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  Search01Icon, 
  DiplomaIcon, 
  FingerAccessIcon, 
  Mail01Icon, 
  CallIcon, 
  PlusSignIcon, 
  CheckmarkCircle02Icon, 
  Cancel01Icon 
} from '@hugeicons/core-free-icons';
import { Api } from '../api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, HugeiconsIconComponent, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  currentTab = signal<string>('dashboard');
  user = signal<any>(null);

  // Icon assets
  readonly Search01Icon = Search01Icon;
  readonly DiplomaIcon = DiplomaIcon;
  readonly FingerAccessIcon = FingerAccessIcon;
  readonly Mail01Icon = Mail01Icon;
  readonly CallIcon = CallIcon;
  readonly PlusSignIcon = PlusSignIcon;
  readonly CheckmarkCircle02Icon = CheckmarkCircle02Icon;
  readonly Cancel01Icon = Cancel01Icon;

  // Clients Directory signals
  clients = signal<any[]>([]);
  searchQuery = signal<string>('');
  isCreateModalOpen = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // New Client Form Object
  newClient = {
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    company_name: '',
    services: [] as string[]
  };

  availableServices = [
    'Compliance Audit',
    'GST Reconciliation',
    'Tax Advisory',
    'Corporate Filings',
    'FEMA Advisory'
  ];

  // Stats Grid (Dashboard tab)
  stats = [
    { title: 'Active Services', value: '4', detail: '+12% from last month', isTrendUp: true },
    { title: 'Compliance Score', value: '98%', detail: 'Excellent Standing', isTrendUp: true },
    { title: 'Open Audit Tasks', value: '2', detail: 'Requires your review', isWarning: true },
    { title: 'Pending Invoices', value: '0', detail: 'All clear', isGood: true }
  ];

  constructor(private router: Router, private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      this.user.set(JSON.parse(savedUser));
      this.fetchClients();
    } catch (e) {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }

  fetchClients() {
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          this.clients.set(res.clients);
        }
      },
      error: (err) => {
        console.error('Failed to fetch clients:', err);
      }
    });
  }

  getFilteredClients() {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.clients();
    }
    return this.clients().filter(c => 
      (c.owner_name || '').toLowerCase().includes(query) ||
      (c.company_name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query)
    );
  }

  getTotalServicesCount(): number {
    return this.clients().reduce((acc, c) => acc + (c.services?.length || 0), 0);
  }

  getCorporateClientPercentage(): string {
    const total = this.clients().length;
    if (total === 0) return '0%';
    const corporate = this.clients().filter(c => !!c.company_name).length;
    return `${Math.round((corporate / total) * 100)}%`;
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
      default: return 'Dashboard';
    }
  }

  openCreateModal() {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.newClient = {
      owner_name: '',
      email: '',
      password: '',
      phone: '',
      company_name: '',
      services: []
    };
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
  }

  toggleService(service: string) {
    const idx = this.newClient.services.indexOf(service);
    if (idx > -1) {
      this.newClient.services.splice(idx, 1);
    } else {
      this.newClient.services.push(service);
    }
  }

  submitCreateClient() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.newClient.owner_name || !this.newClient.email || !this.newClient.password) {
      this.errorMessage.set('Name, email and password are required.');
      return;
    }

    const clientData = {
      ...this.newClient,
      role: 'customer'
    };

    this.api.register(clientData).subscribe({
      next: (res) => {
        this.successMessage.set('Client created successfully!');
        this.fetchClients();
        setTimeout(() => {
          this.closeCreateModal();
        }, 1200);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to create client.');
      }
    });
  }

  handleLogout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
