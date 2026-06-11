import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../api';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-home-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-overview.html',
  styleUrl: './home-overview.css'
})
export class HomeOverview implements OnInit, AfterViewInit, OnDestroy {
  @Output() viewRequests = new EventEmitter<void>();

  @ViewChild('growthChart') growthChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('activityChart') activityChartCanvas!: ElementRef<HTMLCanvasElement>;

  private growthChartInstance: any = null;
  private revenueChartInstance: any = null;
  private activityChartInstance: any = null;

  user = signal<any>(null);
  complianceReminders = signal<any[]>([]);
  orders = signal<any[]>([]);
  clients = signal<any[]>([]);
  tasks = signal<any[]>([]);
  checklists = signal<any[]>([]);
  ongoingItems = signal<any[]>([]);

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
        this.fetchChecklists();
        
        if (parsedUser.role === 'admin' || parsedUser.role === 'client_manager' || parsedUser.role === 'account_manager') {
          this.fetchCompanyComplianceReminders();
          this.fetchCompanyOrders();
        }
      } catch (e) {
        console.error('Failed to parse user in HomeOverview:', e);
      }
    }
  }

  ngAfterViewInit() {
    // Small delay to ensure templates have completed rendering and canvases are fully loaded in DOM
    setTimeout(() => {
      this.initOrUpdateCharts();
    }, 100);
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  goToRequests() {
    this.viewRequests.emit();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
    return u.company_name || (u.company_id && typeof u.company_id === 'object' ? u.company_id.company_name : '');
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
          this.initOrUpdateCharts();
        }
      }
    });
  }

  fetchTasks() {
    this.api.get<any>('tasks').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.tasks.set(res.tasks);
          this.combineOngoingItems();
          this.updateStats();
          this.initOrUpdateCharts();
        }
      }
    });
  }

  fetchChecklists() {
    this.api.get<any>('checklists').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.checklists.set(res.checklists);
          this.combineOngoingItems();
          this.updateStats();
          this.initOrUpdateCharts();
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
          this.initOrUpdateCharts();
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
          this.initOrUpdateCharts();
        }
      }
    });
  }

  combineOngoingItems() {
    const list: any[] = [];
    
    // Add checklists
    this.checklists().forEach(c => {
      list.push({
        _id: c._id,
        title: c.service_name,
        clientName: c.details?.companyName || c.client_id?.company_name || c.client_id?.owner_name || 'Client',
        assignedTo: c.assigned_to?.owner_name || 'Unassigned',
        status: c.status === 'completed' ? 'Certified' : (c.status === 'in_progress' ? 'In Progress' : 'Pending'),
        isCompleted: c.status === 'completed',
        createdAt: c.createdAt,
        type: 'certification'
      });
    });

    // Add tasks
    this.tasks().forEach(t => {
      list.push({
        _id: t._id,
        title: t.title,
        clientName: t.client_id?.company_name || t.client_id?.owner_name || 'Client',
        assignedTo: t.assigned_to?.owner_name || 'Unassigned',
        status: t.status,
        isCompleted: t.status === 'Completed' || t.status === 'Approved',
        createdAt: t.createdAt,
        type: 'task'
      });
    });

    // Sort by createdAt descending
    list.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    this.ongoingItems.set(list);
  }

  destroyCharts() {
    if (this.growthChartInstance) {
      this.growthChartInstance.destroy();
      this.growthChartInstance = null;
    }
    if (this.revenueChartInstance) {
      this.revenueChartInstance.destroy();
      this.revenueChartInstance = null;
    }
    if (this.activityChartInstance) {
      this.activityChartInstance.destroy();
      this.activityChartInstance = null;
    }
  }

  selectedPeriod = signal<string>('last6Months');

  getPeriodLabel(): string {
    const map: Record<string, string> = {
      thisMonth: 'This Month',
      last6Days: 'Last 6 Days',
      last6Months: 'Last 6 Months'
    };
    return map[this.selectedPeriod()] || 'Last 6 Months';
  }

  filterPeriod(period: string) {
    this.selectedPeriod.set(period);
    this.initOrUpdateCharts();
  }

  initOrUpdateCharts() {
    // Only construct if canvas elements are available in the DOM
    if (!this.growthChartCanvas || !this.revenueChartCanvas || !this.activityChartCanvas) {
      return;
    }

    this.destroyCharts();

    let chartLabels: string[] = [];
    let line1Data: number[] = [];
    let line2Data: number[] = [];
    let revenueDataPoints: number[] = [];
    let clientActivityPoints: number[] = [];

    const now = new Date();
    const period = this.selectedPeriod();

    if (period === 'last6Days') {
      // 6 Days period
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        chartLabels.push(d.getDate() + ' ' + d.toLocaleString('default', { month: 'short' }));
        
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();

        let tasksCreated = 0;
        let tasksCompleted = 0;
        let revSum = 0;
        let clientsCount = 0;

        this.tasks().forEach(t => {
          if (!t.createdAt) return;
          const time = new Date(t.createdAt).getTime();
          if (time >= start && time <= end) {
            tasksCreated++;
            if (t.status === 'Completed' || t.status === 'Approved') tasksCompleted++;
          }
        });

        this.checklists().forEach(c => {
          if (!c.createdAt) return;
          const time = new Date(c.createdAt).getTime();
          if (time >= start && time <= end) {
            tasksCreated++;
            if (c.status === 'completed') tasksCompleted++;
          }
        });

        this.clients().forEach(client => {
          if (!client.createdAt) return;
          const time = new Date(client.createdAt).getTime();
          if (time >= start && time <= end) {
            clientsCount++;
            revSum += client.revenue || 0;
          }
        });

        line1Data.push(tasksCreated);
        line2Data.push(tasksCompleted);
        revenueDataPoints.push(revSum);
        clientActivityPoints.push(clientsCount);
      }
    } else if (period === 'thisMonth') {
      // This Month period (by weeks)
      chartLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const weekBounds = [
        { start: new Date(currentYear, currentMonth, 1).getTime(), end: new Date(currentYear, currentMonth, 7, 23, 59, 59).getTime() },
        { start: new Date(currentYear, currentMonth, 8).getTime(), end: new Date(currentYear, currentMonth, 14, 23, 59, 59).getTime() },
        { start: new Date(currentYear, currentMonth, 15).getTime(), end: new Date(currentYear, currentMonth, 21, 23, 59, 59).getTime() },
        { start: new Date(currentYear, currentMonth, 22).getTime(), end: new Date(currentYear, currentMonth, 31, 23, 59, 59).getTime() }
      ];

      for (let i = 0; i < 4; i++) {
        const bounds = weekBounds[i];
        let tasksCreated = 0;
        let tasksCompleted = 0;
        let revSum = 0;
        let clientsCount = 0;

        this.tasks().forEach(t => {
          if (!t.createdAt) return;
          const time = new Date(t.createdAt).getTime();
          if (time >= bounds.start && time <= bounds.end) {
            tasksCreated++;
            if (t.status === 'Completed' || t.status === 'Approved') tasksCompleted++;
          }
        });

        this.checklists().forEach(c => {
          if (!c.createdAt) return;
          const time = new Date(c.createdAt).getTime();
          if (time >= bounds.start && time <= bounds.end) {
            tasksCreated++;
            if (c.status === 'completed') tasksCompleted++;
          }
        });

        this.clients().forEach(client => {
          if (!client.createdAt) return;
          const time = new Date(client.createdAt).getTime();
          if (time >= bounds.start && time <= bounds.end) {
            clientsCount++;
            revSum += client.revenue || 0;
          }
        });

        line1Data.push(tasksCreated);
        line2Data.push(tasksCompleted);
        revenueDataPoints.push(revSum);
        clientActivityPoints.push(clientsCount);
      }
    } else {
      // Last 6 Months (default)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        chartLabels.push(d.toLocaleString('default', { month: 'short' }));
      }

      const taskCountByMonth = [0, 0, 0, 0, 0, 0];
      const completedTaskCountByMonth = [0, 0, 0, 0, 0, 0];

      this.tasks().forEach(task => {
        if (!task.createdAt) return;
        const createdDate = new Date(task.createdAt);
        const diffMonths = (now.getMonth() - createdDate.getMonth()) + (now.getFullYear() - createdDate.getFullYear()) * 12;
        if (diffMonths >= 0 && diffMonths < 6) {
          const index = 5 - diffMonths;
          taskCountByMonth[index]++;
          if (task.status === 'Completed' || task.status === 'Approved') {
            completedTaskCountByMonth[index]++;
          }
        }
      });

      this.checklists().forEach(checklist => {
        if (!checklist.createdAt) return;
        const createdDate = new Date(checklist.createdAt);
        const diffMonths = (now.getMonth() - createdDate.getMonth()) + (now.getFullYear() - createdDate.getFullYear()) * 12;
        if (diffMonths >= 0 && diffMonths < 6) {
          const index = 5 - diffMonths;
          taskCountByMonth[index]++;
          if (checklist.status === 'completed') {
            completedTaskCountByMonth[index]++;
          }
        }
      });

      line1Data = taskCountByMonth;
      line2Data = completedTaskCountByMonth;

      const revenueByMonth = [0, 0, 0, 0, 0, 0];
      this.clients().forEach(client => {
        const createdDate = client.createdAt ? new Date(client.createdAt) : new Date();
        const diffMonths = (now.getMonth() - createdDate.getMonth()) + (now.getFullYear() - createdDate.getFullYear()) * 12;
        if (diffMonths >= 0 && diffMonths < 6) {
          const index = 5 - diffMonths;
          revenueByMonth[index] += client.revenue || 0;
        }
      });
      revenueDataPoints = revenueByMonth;

      const clientCountByMonth = [0, 0, 0, 0, 0, 0];
      this.clients().forEach(client => {
        const createdDate = client.createdAt ? new Date(client.createdAt) : new Date();
        const diffMonths = (now.getMonth() - createdDate.getMonth()) + (now.getFullYear() - createdDate.getFullYear()) * 12;
        if (diffMonths >= 0 && diffMonths < 6) {
          const index = 5 - diffMonths;
          clientCountByMonth[index]++;
        }
      });
      clientActivityPoints = clientCountByMonth;
    }

    const ctxGrowth = this.growthChartCanvas.nativeElement.getContext('2d');
    const ctxRevenue = this.revenueChartCanvas.nativeElement.getContext('2d');
    const ctxActivity = this.activityChartCanvas.nativeElement.getContext('2d');

    if (!ctxGrowth || !ctxRevenue || !ctxActivity) return;

    const chartConfigDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { display: false },
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } }
      }
    };

    this.growthChartInstance = new Chart(ctxGrowth, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          { label: 'Total Tasks', data: line1Data, borderColor: '#006a61', borderWidth: 2, tension: 0.4, pointRadius: 0 },
          { label: 'Completed', data: line2Data, borderColor: '#000000', borderWidth: 2, tension: 0.4, pointRadius: 0, borderDash: [5, 5] }
        ]
      },
      options: chartConfigDefaults
    });

    this.revenueChartInstance = new Chart(ctxRevenue, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{ 
          data: revenueDataPoints,
          backgroundColor: '#006a61',
          borderRadius: 4
        }]
      },
      options: chartConfigDefaults
    });

    this.activityChartInstance = new Chart(ctxActivity, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          { label: 'Clients Onboarded', data: clientActivityPoints, fill: true, backgroundColor: 'rgba(0,106,97,0.05)', borderColor: '#006a61', borderWidth: 2, tension: 0.4, pointRadius: 0 }
        ]
      },
      options: chartConfigDefaults
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

