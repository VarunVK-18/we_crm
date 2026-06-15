import { Component, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, WeLoaderComponent],
  templateUrl: './employee-profile.html',
  styleUrl: './employee-profile.css'
})
export class EmployeeProfile implements OnInit {
  employee = input.required<any>();
  goBack = output<void>();
  viewClient = output<string>();

  assignedClients = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(private api: Api) {}

  ngOnInit() {
    this.fetchClients();
  }

  fetchClients() {
    this.isLoading.set(true);
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          const empId = this.employee().id || this.employee()._id;
          const empRole = this.employee().role;
          
          const filtered = res.clients.filter((c: any) => {
            if (empRole === 'client_manager') {
              // Client Managers own the clients they created/onboarded
              if (c.created_by) {
                const createdById = typeof c.created_by === 'object' ? c.created_by._id : c.created_by;
                return String(createdById) === String(empId);
              }
              return false;
            } else {
              // Filling Staff and Account Managers are assigned clients
              if (c.assigned_to) {
                 const assignedToId = typeof c.assigned_to === 'object' ? c.assigned_to._id : c.assigned_to;
                 return String(assignedToId) === String(empId);
              }
              return false;
            }
          });
          this.assignedClients.set(filtered);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load clients.');
        this.isLoading.set(false);
      }
    });
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

  getInitials(name?: string): string {
    const nameStr = name || 'User';
    return nameStr.charAt(0).toUpperCase();
  }
}
