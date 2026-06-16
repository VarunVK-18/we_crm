import { Component, OnInit, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';

@Component({
  selector: 'app-employees-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees-team.html',
  styleUrl: './employees-team.css'
})
export class EmployeesTeam implements OnInit {
  user = signal<any>(null);
  teams = input<any[]>([]);
  refreshTeams = output<void>();
  viewEmployee = output<any>();

  // Directory State
  currentDirectoryTab = signal<string>('all');
  searchQuery = signal<string>('');

  // Modals state
  isCreateEmployeeModalOpen = signal<boolean>(false);
  isEditEmployeeModalOpen = signal<boolean>(false);
  isDeleteEmployeeModalOpen = signal<boolean>(false);
  employeeErrorMessage = signal<string>('');
  employeeSuccessMessage = signal<string>('');
  isSubmitting = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  newEmployee = {
    name: '',
    email: '',
    password: '',
    role: 'filling_staff'
  };

  editEmployee = {
    id: '',
    name: '',
    email: '',
    role: 'filling_staff'
  };

  selectedEmployee = {
    id: '',
    name: ''
  };

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
  }

  getCompanyId(): string | null {
    const u = this.user();
    if (!u) return null;
    if (u.company_id && typeof u.company_id === 'object') {
      return u.company_id._id || null;
    }
    return u.company_id || null;
  }

  getInitials(name?: string): string {
    const nameStr = name || 'User';
    return nameStr.charAt(0).toUpperCase();
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'HR Specialist',
      client_manager: 'Client Manager',
      filling_staff: 'Filing Staff',
      account_manager: 'Account Manager'
    };
    return labels[role] || role;
  }

  getFlatEmployees() {
    const flat: any[] = [];
    this.teams().forEach(t => {
      if (t.members) flat.push(...t.members);
    });
    return flat;
  }

  filteredEmployees() {
    const all = this.getFlatEmployees();
    const tab = this.currentDirectoryTab();
    const query = this.searchQuery().toLowerCase().trim();
    
    let filtered = all;
    if (tab === 'admins') filtered = all.filter(m => m.role === 'admin');
    else if (tab === 'filing') filtered = all.filter(m => m.role === 'filling_staff');
    else if (tab === 'clients') filtered = all.filter(m => m.role === 'client_manager');
    
    if (query) {
      filtered = filtered.filter(m => 
        (m.name && m.name.toLowerCase().includes(query)) ||
        (m.email && m.email.toLowerCase().includes(query)) ||
        (m.role && this.getRoleLabel(m.role).toLowerCase().includes(query))
      );
    }
    return filtered;
  }

  getDepartment(role: string): string {
    switch(role) {
      case 'admin': return 'IT Operations';
      case 'filling_staff': return 'Filing Operations';
      case 'client_manager': return 'Client Relations';
      case 'account_manager': return 'Account Management';
      default: return 'General Staff';
    }
  }

  getAccessTier(role: string): string {
    switch(role) {
      case 'admin': return 'Tier 1 Admin';
      case 'client_manager': return 'Standard';
      case 'filling_staff': return 'Processing';
      default: return 'Basic';
    }
  }

  getAccessTierClass(role: string): string {
    switch(role) {
      case 'admin': return 'bg-primary-fixed-dim text-on-primary-fixed';
      case 'client_manager': return 'bg-secondary-container text-on-secondary-container';
      case 'filling_staff': return 'bg-tertiary-fixed text-on-tertiary-fixed';
      default: return 'bg-surface-variant text-on-surface';
    }
  }

  fetchTeams() {
    this.refreshTeams.emit();
  }

  viewEmployeeProfile(member: any) {
    this.viewEmployee.emit(member);
  }

  openCreateEmployeeModal() {
    this.employeeErrorMessage.set('');
    this.employeeSuccessMessage.set('');
    this.newEmployee = {
      name: '',
      email: '',
      password: '',
      role: 'filling_staff'
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
      this.employeeErrorMessage.set('All fields are required.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      ...this.newEmployee,
      company_id: this.getCompanyId()
    };

    this.api.post<any>('auth/register-direct', payload).subscribe({
      next: (res) => {
        this.employeeSuccessMessage.set('Employee created successfully!');
        this.fetchTeams();
        setTimeout(() => {
          this.isSubmitting.set(false);
          this.closeCreateEmployeeModal();
        }, 1200);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.employeeErrorMessage.set(err.error?.message || 'Failed to register employee.');
      }
    });
  }

  openEditEmployeeModal(member: any) {
    this.employeeErrorMessage.set('');
    this.employeeSuccessMessage.set('');
    this.editEmployee = {
      id: member.id || member._id,
      name: member.name || member.owner_name,
      email: member.email,
      role: member.role
    };
    this.isEditEmployeeModalOpen.set(true);
  }

  closeEditEmployeeModal() {
    this.isEditEmployeeModalOpen.set(false);
  }

  submitEditEmployee() {
    this.employeeErrorMessage.set('');
    this.employeeSuccessMessage.set('');
    if (!this.editEmployee.name || !this.editEmployee.email) {
      this.employeeErrorMessage.set('Name and email are required.');
      return;
    }
    this.api.patch<any>(`update_user/${this.editEmployee.id}`, this.editEmployee).subscribe({
      next: (res) => {
        this.employeeSuccessMessage.set('Employee details updated!');
        this.fetchTeams();
        setTimeout(() => {
          this.closeEditEmployeeModal();
        }, 1200);
      },
      error: (err) => {
        this.employeeErrorMessage.set(err.error?.message || 'Failed to update employee.');
      }
    });
  }

  openDeleteEmployeeModal(member: any) {
    this.selectedEmployee = {
      id: member.id || member._id,
      name: member.name || member.owner_name
    };
    this.isDeleteEmployeeModalOpen.set(true);
  }

  closeDeleteEmployeeModal() {
    this.isDeleteEmployeeModalOpen.set(false);
  }

  submitDeleteEmployee() {
    this.isDeleting.set(true);
    this.api.delete<any>(`delete_user/${this.selectedEmployee.id}`).subscribe({
      next: (res: any) => {
        this.fetchTeams();
        this.isDeleting.set(false);
        this.closeDeleteEmployeeModal();
      },
      error: (err: any) => {
        this.isDeleting.set(false);
        alert(err.error?.message || 'Failed to delete employee.');
      }
    });
  }
}
