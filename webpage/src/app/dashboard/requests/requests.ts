import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { UserIcon, CheckmarkBadge01Icon, Time01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class RequestsComponent implements OnInit {
  user = signal<any>(null);
  orders = signal<any[]>([]);
  teams = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  
  // Icons
  readonly UserIcon = UserIcon;
  readonly CheckmarkBadge01Icon = CheckmarkBadge01Icon;
  readonly Time01Icon = Time01Icon;

  // Selected employee per order { orderId: employeeData }
  selectedEmployeeForOrder = signal<Record<string, any>>({});
  
  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.user.set(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
    
    this.fetchOrders();
    this.fetchTeam();
  }

  getCompanyId(): string | null {
    const u = this.user();
    if (!u) return null;
    if (u.company_id && typeof u.company_id === 'object') {
      return u.company_id._id || null;
    }
    return u.company_id || null;
  }

  fetchOrders() {
    const companyId = this.getCompanyId();
    if (!companyId) return;

    this.isLoading.set(true);
    this.api.get<any>(`orders/company/${companyId}`).subscribe({
      next: (res) => {
        if (res && res.orders) {
          // Only show orders that need to be worked on
          const activeOrders = res.orders.filter((o: any) => o.status !== 'complete');
          this.orders.set(activeOrders);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        this.isLoading.set(false);
      }
    });
  }

  fetchTeam() {
    this.api.get<any>('users/team/my-team').subscribe({
      next: (res) => {
        if (res && res.groups) {
          this.teams.set(res.groups);
        }
      },
      error: (err) => console.error('Error fetching team:', err)
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
  
  onEmployeeSelectChange(orderId: string, event: any) {
    const empId = event.target.value;
    const allEmps = this.getFlatEmployees();
    const selectedEmp = allEmps.find(e => e.id === empId);
    
    if (selectedEmp) {
      this.selectedEmployeeForOrder.update(prev => ({ ...prev, [orderId]: selectedEmp }));
    } else {
      this.selectedEmployeeForOrder.update(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  }

  assignEmployee(orderId: string) {
    const emp = this.selectedEmployeeForOrder()[orderId];
    if (!emp) {
      alert('Please select an employee first.');
      return;
    }
    
    const updateData = {
      assignedExpert: emp.name,
      expertPhone: emp.phone || '',
      stage: 'workAssigned'
    };

    this.api.put<any>(`orders/${orderId}`, updateData).subscribe({
      next: (res) => {
        alert('Employee assigned successfully!');
        this.fetchOrders();
      },
      error: (err) => {
        console.error('Error assigning employee', err);
        alert('Failed to assign employee.');
      }
    });
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
