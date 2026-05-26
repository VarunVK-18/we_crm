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
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');

  // Icons
  readonly UserIcon = UserIcon;
  readonly CheckmarkBadge01Icon = CheckmarkBadge01Icon;
  readonly Time01Icon = Time01Icon;

  // Filter state
  statusFilter = signal<string>('new');

  readonly NEW_STATUSES = ['new', 'pending'];
  readonly NEW_STAGES = ['reqreceived', 'quot pending', 'quotepending'];

  // An order is considered "new/incoming" if status is new/pending OR stage is reqReceived
  isNewOrder(o: any): boolean {
    const status = (o.status || '').toLowerCase();
    const stage = (o.stage || '').toLowerCase();
    return this.NEW_STATUSES.includes(status) || this.NEW_STAGES.includes(stage);
  }

  filteredOrders = computed(() => {
    const filter = this.statusFilter();
    const all = this.orders();
    if (filter === 'all') return all;
    if (filter === 'new') return all.filter((o: any) => this.isNewOrder(o));
    if (filter === 'active') return all.filter((o: any) => !this.isNewOrder(o) && (o.status || '').toLowerCase() === 'active');
    return all.filter((o: any) => (o.status || '').toLowerCase() === filter);
  });

  orderCounts = computed(() => {
    const all = this.orders();
    return {
      all: all.length,
      new: all.filter((o: any) => this.isNewOrder(o)).length,
      active: all.filter((o: any) => !this.isNewOrder(o) && (o.status || '').toLowerCase() === 'active').length,
      complete: all.filter((o: any) => (o.status || '').toLowerCase() === 'complete').length,
    };
  });

  // Selected employee per order { orderId: employeeData }
  selectedEmployeeForOrder = signal<Record<string, any>>({});
  // Deal closed amount per order { orderId: number }
  dealClosedAmountForOrder = signal<Record<string, number>>({});

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

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(''), 3500);
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
    if (!companyId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.api.get<any>(`orders/company/${companyId}`).subscribe({
      next: (res: any) => {
        if (res && res.orders) {
          // Sort by newest first
          const sorted = [...res.orders].sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.orders.set(sorted);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching orders:', err);
        this.isLoading.set(false);
        this.showToast('Failed to load requests.', 'error');
      }
    });
  }

  fetchTeam() {
    this.api.get<any>('users/team-groups').subscribe({
      next: (res: any) => {
        // team-groups returns an array of groups directly
        if (Array.isArray(res)) {
          this.teams.set(res);
        } else if (res && res.groups) {
          this.teams.set(res.groups);
        }
      },
      error: (err: any) => console.error('Error fetching team:', err)
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

  onAmountChange(orderId: string, event: any) {
    const val = event.target.value ? Number(event.target.value) : 0;
    this.dealClosedAmountForOrder.update(prev => ({ ...prev, [orderId]: val }));
  }

  assignEmployee(orderId: string) {
    const emp = this.selectedEmployeeForOrder()[orderId];
    if (!emp) {
      this.showToast('Please select an employee first.', 'error');
      return;
    }

    const amount = this.dealClosedAmountForOrder()[orderId] || 0;

    const updateData: any = {
      assignedExpert: emp.name,
      expertPhone: emp.phone || '',
      stage: 'workAssigned'
    };

    if (amount > 0) {
      updateData.dealClosedAmount = amount;
    }

    this.api.put<any>(`orders/${orderId}`, updateData).subscribe({
      next: (res: any) => {
        this.showToast(`Assigned to ${emp.name} successfully!`, 'success');
        
        // Reset local selection & amount for this order
        this.selectedEmployeeForOrder.update(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        this.dealClosedAmountForOrder.update(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });

        this.fetchOrders();
      },
      error: (err: any) => {
        console.error('Error assigning employee', err);
        this.showToast('Failed to assign employee.', 'error');
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
