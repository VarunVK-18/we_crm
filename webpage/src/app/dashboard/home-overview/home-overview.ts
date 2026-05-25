import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../api';

@Component({
  selector: 'app-home-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-overview.html',
  styleUrl: './home-overview.css'
})
export class HomeOverview implements OnInit {
  user = signal<any>(null);
  complianceReminders = signal<any[]>([]);
  orders = signal<any[]>([]);
  clients = signal<any[]>([]);
  tasks = signal<any[]>([]);

  stats: any[] = [
    { title: 'Active Services', value: '0', detail: '+12% from last month', isTrendUp: true },
    { title: 'Compliance Score', value: '100%', detail: 'Excellent Standing', isTrendUp: true },
    { title: 'Open Audit Tasks', value: '0', detail: 'All caught up', isGood: true },
    { title: 'Pending Invoices', value: '0', detail: 'All clear', isGood: true }
  ];

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        this.user.set(parsedUser);
        
        // Fetch all metrics data
        this.fetchClients();
        this.fetchTasks();
        
        if (parsedUser.role === 'admin') {
          this.fetchCompanyComplianceReminders();
          this.fetchCompanyOrders();
        }
      } catch (e) {
        console.error('Failed to parse user in HomeOverview:', e);
      }
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

  getCompanyName(): string {
    const u = this.user();
    if (!u) return '';
    if (u.company_id && typeof u.company_id === 'object' && u.company_id.company_name) {
      return u.company_id.company_name;
    }
    return u.company_name || '';
  }

  getCompanyCode(): string {
    const u = this.user();
    if (!u) return '';
    if (u.company_id && typeof u.company_id === 'object' && u.company_id.company_code) {
      return u.company_id.company_code;
    }
    return u.company_code || '';
  }

  getTotalServicesCount(): number {
    return this.clients().reduce((acc, c) => acc + (c.services?.length || 0), 0);
  }

  fetchClients() {
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          this.clients.set(res.clients);
          this.updateStats();
        }
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
}
