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
    business_type: '',
    pan: '',
    gstin: '',
    address: '',
    status: 'active',
    revenue: 0,
    services: [] as string[]
  };

  selectedGstinFile: File | null = null;
  selectedPanFile: File | null = null;

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

  // Employee Management
  teams = signal<any[]>([]);
  isCreateEmployeeModalOpen = signal<boolean>(false);
  isEditEmployeeModalOpen = signal<boolean>(false);
  isDeleteEmployeeModalOpen = signal<boolean>(false);
  employeeErrorMessage = signal<string>('');
  employeeSuccessMessage = signal<string>('');

  newEmployee = {
    name: '',
    email: '',
    password: '',
    role: 'agent'
  };

  selectedEmployee = {
    id: '',
    name: '',
    email: '',
    role: 'agent'
  };

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
      this.fetchTeams();
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

  fetchTeams() {
    this.api.get<any[]>('users/team-groups').subscribe({
      next: (res) => {
        this.teams.set(res || []);
      },
      error: (err) => {
        console.error('Failed to fetch teams:', err);
      }
    });
  }

  openCreateEmployeeModal() {
    this.employeeErrorMessage.set('');
    this.employeeSuccessMessage.set('');
    this.newEmployee = {
      name: '',
      email: '',
      password: '',
      role: 'agent'
    };
    this.isCreateEmployeeModalOpen.set(true);
  }

  closeCreateEmployeeModal() {
    this.isCreateEmployeeModalOpen.set(false);
  }

  submitCreateEmployee() {
    this.employeeErrorMessage.set('');
    this.employeeSuccessMessage.set('');

    if (!this.newEmployee.name || !this.newEmployee.email || !this.newEmployee.password) {
      this.employeeErrorMessage.set('Name, email, and password are required.');
      return;
    }

    this.api.post<any>('auth/register-direct', this.newEmployee).subscribe({
      next: (res: any) => {
        this.employeeSuccessMessage.set('Employee added successfully!');
        this.fetchTeams();
        setTimeout(() => {
          this.closeCreateEmployeeModal();
        }, 1200);
      },
      error: (err: any) => {
        this.employeeErrorMessage.set(err.error?.message || 'Failed to add employee.');
      }
    });
  }

  openEditEmployeeModal(member: any) {
    this.employeeErrorMessage.set('');
    this.employeeSuccessMessage.set('');
    this.selectedEmployee = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role || 'agent'
    };
    this.isEditEmployeeModalOpen.set(true);
  }

  closeEditEmployeeModal() {
    this.isEditEmployeeModalOpen.set(false);
  }

  submitEditEmployee() {
    this.employeeErrorMessage.set('');
    this.employeeSuccessMessage.set('');

    if (!this.selectedEmployee.name || !this.selectedEmployee.email) {
      this.employeeErrorMessage.set('Name and email are required.');
      return;
    }

    this.api.patch<any>(`edit_user/${this.selectedEmployee.id}`, this.selectedEmployee).subscribe({
      next: (res: any) => {
        this.employeeSuccessMessage.set('Employee details updated successfully!');
        this.fetchTeams();
        setTimeout(() => {
          this.closeEditEmployeeModal();
        }, 1200);
      },
      error: (err: any) => {
        this.employeeErrorMessage.set(err.error?.message || 'Failed to update employee.');
      }
    });
  }

  resetEmployeePassword() {
    this.employeeErrorMessage.set('');
    this.employeeSuccessMessage.set('');

    this.api.post<any>(`reset-password/${this.selectedEmployee.id}`, {}).subscribe({
      next: (res: any) => {
        this.employeeSuccessMessage.set('Password reset successfully to Default@123!');
      },
      error: (err: any) => {
        this.employeeErrorMessage.set(err.error?.message || 'Failed to reset password.');
      }
    });
  }

  openDeleteEmployeeModal(member: any) {
    this.selectedEmployee = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role || 'agent'
    };
    this.isDeleteEmployeeModalOpen.set(true);
  }

  closeDeleteEmployeeModal() {
    this.isDeleteEmployeeModalOpen.set(false);
  }

  submitDeleteEmployee() {
    this.api.delete<any>(`delete_user/${this.selectedEmployee.id}`).subscribe({
      next: (res: any) => {
        this.fetchTeams();
        this.closeDeleteEmployeeModal();
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to delete employee.');
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
    if (tabId === 'team') {
      this.fetchTeams();
    }
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
    this.selectedGstinFile = null;
    this.selectedPanFile = null;
    this.newClient = {
      owner_name: '',
      email: '',
      password: '',
      phone: '',
      company_name: '',
      business_type: '',
      pan: '',
      gstin: '',
      address: '',
      status: 'active',
      revenue: 0,
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

  onGstinFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedGstinFile = file;
    }
  }

  onPanFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedPanFile = file;
    }
  }

  submitCreateClient() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.newClient.owner_name || !this.newClient.email) {
      this.errorMessage.set('Name and email are required.');
      return;
    }

    const formData = new FormData();
    formData.append('owner_name', this.newClient.owner_name);
    formData.append('email', this.newClient.email);
    formData.append('password', this.newClient.password || '');
    formData.append('phone', this.newClient.phone || '');
    formData.append('company_name', this.newClient.company_name || '');
    formData.append('business_type', this.newClient.business_type || '');
    formData.append('pan', this.newClient.pan || '');
    formData.append('gstin', this.newClient.gstin || '');
    formData.append('address', this.newClient.address || '');
    formData.append('status', this.newClient.status || 'active');
    formData.append('revenue', String(this.newClient.revenue || 0));
    formData.append('role', 'customer');
    formData.append('services', JSON.stringify(this.newClient.services));

    if (this.selectedGstinFile) {
      formData.append('gstin_file', this.selectedGstinFile);
    }
    if (this.selectedPanFile) {
      formData.append('pan_file', this.selectedPanFile);
    }

    this.api.register(formData).subscribe({
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
