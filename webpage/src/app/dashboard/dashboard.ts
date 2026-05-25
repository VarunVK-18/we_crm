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
  complianceReminders = signal<any[]>([]);
  orders = signal<any[]>([]);

  stats: any[] = [
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

  // Filing Tasks State
  tasks = signal<any[]>([]);
  isCreateTaskModalOpen = signal<boolean>(false);
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskClientId = '';
  newTaskAssignedTo = '';
  taskErrorMessage = signal<string>('');
  taskSuccessMessage = signal<string>('');

  // Comment Modal State
  isCommentModalOpen = signal<boolean>(false);
  commentText = '';
  selectedTaskId = '';

  // Upload Doc Modal State
  isUploadDocModalOpen = signal<boolean>(false);
  selectedTaskDocName = '';
  selectedTaskDocFile: File | null = null;

  // System Audit Logs State
  logs = signal<any[]>([]);

  // Settings State
  settings = signal<any>({
    incorporation_fee: 5000,
    default_filing_tax: 18,
    allow_agent_registration: true,
    require_document_verification: true
  });

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
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role === 'customer') {
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
        return;
      }
      this.user.set(parsedUser);
      this.fetchClients();
      this.fetchTeams();
      this.fetchCompanyComplianceReminders();
      this.fetchCompanyOrders();
      this.fetchTasks();
    } catch (e) {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }

  /** Returns the company_id string for the logged-in admin's company */
  getCompanyId(): string | null {
    const u = this.user();
    if (!u) return null;
    // company_id can be a populated object or a plain ObjectId string
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

  fetchClients() {
    const companyId = this.getCompanyId();
    const endpoint = companyId ? `users/clients?company_id=${companyId}` : 'users/clients';
    this.api.get<any>(endpoint).subscribe({
      next: (res) => {
        if (res && res.clients) {
          this.clients.set(res.clients);
          this.updateStats();
        }
      },
      error: (err) => {
        console.error('Failed to fetch clients:', err);
      }
    });
  }

  fetchTeams() {
    const companyId = this.getCompanyId();
    const endpoint = companyId ? `users/team-groups?company_id=${companyId}` : 'users/team-groups';
    this.api.get<any[]>(endpoint).subscribe({
      next: (res) => {
        this.teams.set(res || []);
      },
      error: (err) => {
        console.error('Failed to fetch teams:', err);
      }
    });
  }

  fetchCompanyComplianceReminders() {
    const companyId = this.getCompanyId();
    if (!companyId) return;
    this.api.get<any>(`compliance/company/${companyId}`).subscribe({
      next: (res) => {
        if (res && res.reminders) {
          this.complianceReminders.set(res.reminders);
          this.updateStats();
        }
      },
      error: (err) => {
        console.error('Failed to fetch company compliance reminders:', err);
      }
    });
  }

  fetchCompanyOrders() {
    const companyId = this.getCompanyId();
    if (!companyId) return;
    this.api.get<any>(`orders/company/${companyId}`).subscribe({
      next: (res) => {
        if (res && res.orders) {
          this.orders.set(res.orders);
          this.updateStats();
        }
      },
      error: (err) => {
        console.error('Failed to fetch company orders:', err);
      }
    });
  }

  updateStats() {
    const activeServicesCount = this.getTotalServicesCount();

    const reminders = this.complianceReminders();
    let complianceScoreValue = 100;
    let complianceDetail = 'Excellent Standing';
    let complianceTrendUp = true;
    if (reminders.length > 0) {
      const expired = reminders.filter(r => r.status === 'expired').length;
      const urgent = reminders.filter(r => r.status === 'urgent').length;
      const expiringSoon = reminders.filter(r => r.status === 'expiringSoon').length;
      complianceScoreValue = Math.max(0, Math.round(100 - (expired * 20 + urgent * 10 + expiringSoon * 2)));

      if (complianceScoreValue >= 95) {
        complianceDetail = 'Excellent Standing';
        complianceTrendUp = true;
      } else if (complianceScoreValue >= 80) {
        complianceDetail = 'Good Standing';
        complianceTrendUp = true;
      } else if (complianceScoreValue >= 60) {
        complianceDetail = 'Needs Attention';
        complianceTrendUp = false;
      } else {
        complianceDetail = 'Critical Actions Required';
        complianceTrendUp = false;
      }
    }

    const openTasksCount = this.tasks().filter(t => !['Approved', 'Completed', 'Rejected'].includes(t.status)).length;
    const pendingInvoicesCount = this.orders().filter(o => o.status === 'notInitialized').length;

    this.stats = [
      { 
        title: 'Active Services', 
        value: activeServicesCount.toString(), 
        detail: '+12% from last month', 
        isTrendUp: true 
      },
      { 
        title: 'Compliance Score', 
        value: `${complianceScoreValue}%`, 
        detail: complianceDetail, 
        isTrendUp: complianceTrendUp 
      },
      { 
        title: 'Open Audit Tasks', 
        value: openTasksCount.toString(), 
        detail: openTasksCount > 0 ? 'Requires your review' : 'All caught up', 
        isWarning: openTasksCount > 0,
        isGood: openTasksCount === 0 
      },
      { 
        title: 'Pending Invoices', 
        value: pendingInvoicesCount.toString(), 
        detail: pendingInvoicesCount > 0 ? `${pendingInvoicesCount} requires initialization` : 'All clear', 
        isGood: pendingInvoicesCount === 0,
        isWarning: pendingInvoicesCount > 0
      }
    ];
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

    const payload = {
      ...this.newEmployee,
      company_id: this.getCompanyId()
    };

    this.api.post<any>('auth/register-direct', payload).subscribe({
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
    } else if (tabId === 'tasks') {
      this.fetchTasks();
      this.fetchClients();
      this.fetchTeams();
    } else if (tabId === 'logs') {
      this.fetchLogs();
    } else if (tabId === 'settings') {
      this.fetchSettings();
    }
  }

  getTabLabel(): string {
    switch (this.currentTab()) {
      case 'dashboard': return 'Dashboard';
      case 'clients': return 'Clients Directory';
      case 'team': return 'Employees & Team';
      case 'tasks': return 'Filing Tasks';
      case 'logs': return 'System Audit Logs';
      case 'settings': return 'System Settings';
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

    // Scope client to the admin's company
    const companyId = this.getCompanyId();
    if (companyId) {
      formData.append('company_id', companyId);
    }

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

  getFlatEmployees() {
    const flat: any[] = [];
    this.teams().forEach(g => {
      if (g.members) {
        flat.push(...g.members);
      }
    });
    return flat;
  }

  assignClientToEmployee(clientId: string, employeeId: string) {
    this.api.patch<any>(`users/clients/${clientId}/assign`, { employee_id: employeeId || null }).subscribe({
      next: (res) => {
        this.fetchClients();
        alert('Client assigned successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to assign client.');
      }
    });
  }

  updateOnboardingStatus(clientId: string, status: string) {
    this.api.patch<any>(`users/clients/${clientId}/onboarding`, { onboarding_status: status }).subscribe({
      next: (res) => {
        this.fetchClients();
        alert('Onboarding status updated!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update onboarding status.');
      }
    });
  }

  fetchTasks() {
    this.api.get<any>('tasks').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.tasks.set(res.tasks);
          this.updateStats();
        }
      },
      error: (err) => {
        console.error('Failed to fetch tasks:', err);
      }
    });
  }

  openCreateTaskModal(clientId?: string) {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskClientId = clientId || '';
    this.newTaskAssignedTo = '';
    this.taskErrorMessage.set('');
    this.taskSuccessMessage.set('');
    this.isCreateTaskModalOpen.set(true);
  }

  submitCreateTask() {
    this.taskErrorMessage.set('');
    this.taskSuccessMessage.set('');
    if (!this.newTaskClientId || !this.newTaskTitle) {
      this.taskErrorMessage.set('Client and Task Title are required.');
      return;
    }
    const payload = {
      client_id: this.newTaskClientId,
      assigned_to: this.newTaskAssignedTo || null,
      title: this.newTaskTitle,
      description: this.newTaskDescription
    };
    this.api.post<any>('tasks', payload).subscribe({
      next: (res) => {
        this.taskSuccessMessage.set('Task created successfully!');
        this.fetchTasks();
        setTimeout(() => {
          this.isCreateTaskModalOpen.set(false);
        }, 1200);
      },
      error: (err) => {
        this.taskErrorMessage.set(err.error?.message || 'Failed to create task.');
      }
    });
  }

  updateTaskStatus(taskId: string, newStatus: string) {
    this.api.patch<any>(`tasks/${taskId}`, { status: newStatus }).subscribe({
      next: (res) => {
        this.fetchTasks();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update task status.');
      }
    });
  }

  assignTaskToStaff(taskId: string, staffId: string) {
    this.api.patch<any>(`tasks/${taskId}`, { assigned_to: staffId || null }).subscribe({
      next: (res) => {
        this.fetchTasks();
        alert('Task assigned successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to assign task.');
      }
    });
  }

  openCommentModal(task: any) {
    this.selectedTaskId = task._id;
    this.commentText = '';
    this.isCommentModalOpen.set(true);
  }

  submitComment() {
    if (!this.commentText.trim()) return;
    this.api.post<any>(`tasks/${this.selectedTaskId}/comments`, { comment: this.commentText }).subscribe({
      next: (res) => {
        this.fetchTasks();
        this.isCommentModalOpen.set(false);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add comment.');
      }
    });
  }

  openUploadDocModal(task: any) {
    this.selectedTaskId = task._id;
    this.selectedTaskDocName = '';
    this.selectedTaskDocFile = null;
    this.isUploadDocModalOpen.set(true);
  }

  onTaskDocFileSelected(event: any) {
    this.selectedTaskDocFile = event.target.files?.[0] || null;
  }

  submitUploadDoc() {
    if (!this.selectedTaskDocName || !this.selectedTaskDocFile) {
      alert('Document name and file are required.');
      return;
    }
    const formData = new FormData();
    formData.append('document_name', this.selectedTaskDocName);
    formData.append('file', this.selectedTaskDocFile);

    this.api.post<any>(`tasks/${this.selectedTaskId}/documents`, formData).subscribe({
      next: (res) => {
        this.fetchTasks();
        this.isUploadDocModalOpen.set(false);
        alert('Document uploaded successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to upload document.');
      }
    });
  }

  fetchLogs() {
    this.api.get<any>('audit-logs').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.logs.set(res.logs);
        }
      },
      error: (err) => {
        console.error('Failed to fetch audit logs:', err);
      }
    });
  }

  fetchSettings() {
    this.api.get<any>('settings').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.settings.set(res.settings);
        }
      },
      error: (err) => {
        console.error('Failed to fetch settings:', err);
      }
    });
  }

  saveSettings() {
    this.api.post<any>('settings', this.settings()).subscribe({
      next: (res) => {
        alert('Settings saved successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to save settings.');
      }
    });
  }

  handleLogout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
