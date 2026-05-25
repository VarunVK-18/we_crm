import { Component, OnInit, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  PlusSignIcon, 
  Cancel01Icon 
} from '@hugeicons/core-free-icons';
import { Api } from '../../api';

@Component({
  selector: 'app-employees-team',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './employees-team.html',
  styleUrl: './employees-team.css'
})
export class EmployeesTeam implements OnInit {
  user = signal<any>(null);
  teams = input<any[]>([]);
  refreshTeams = output<void>();

  // Icon assets
  readonly PlusSignIcon = PlusSignIcon;
  readonly Cancel01Icon = Cancel01Icon;

  // Modals state
  isCreateEmployeeModalOpen = signal<boolean>(false);
  isEditEmployeeModalOpen = signal<boolean>(false);
  isDeleteEmployeeModalOpen = signal<boolean>(false);
  employeeErrorMessage = signal<string>('');
  employeeSuccessMessage = signal<string>('');

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

  fetchTeams() {
    this.refreshTeams.emit();
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

    const payload = {
      ...this.newEmployee,
      company_id: this.getCompanyId()
    };

    this.api.post<any>('auth/register-employee', payload).subscribe({
      next: (res) => {
        this.employeeSuccessMessage.set('Employee created successfully!');
        this.fetchTeams();
        setTimeout(() => {
          this.closeCreateEmployeeModal();
        }, 1200);
      },
      error: (err) => {
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
}
