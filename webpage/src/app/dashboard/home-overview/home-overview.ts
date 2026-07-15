import { Component, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy, Output, EventEmitter, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../api';
import Chart from 'chart.js/auto';

const homeOverviewCache = {
  clients: null as any[] | null,
  tasks: null as any[] | null,
  checklists: null as any[] | null,
  reminders: null as any[] | null,
  orders: null as any[] | null,
  dashboardStats: null as any | null,
  lastFetchTime: 0
  // dashboardStatsTime is kept separately per month
};

@Component({
  selector: 'app-home-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-overview.html',
  styleUrl: './home-overview.css'
})
export class HomeOverview implements OnInit, AfterViewInit, OnDestroy {
  @Output() viewRequests = new EventEmitter<void>();
  @Output() viewChecklist = new EventEmitter<string>();
  searchQuery = input<string>('');

  @ViewChild('growthChart') growthChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('activityChart') activityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('upscalingChart') upscalingChartCanvas!: ElementRef<HTMLCanvasElement>;

  private growthChartInstance: any = null;
  private revenueChartInstance: any = null;
  private activityChartInstance: any = null;
  private upscalingChartInstance: any = null;

  user = signal<any>(null);
  isLoading = signal<boolean>(true);
  revenueGrowth = signal<string>('+0.0%');
  revenueTrendUp = signal<boolean>(true);
  complianceReminders = signal<any[]>([]);
  orders = signal<any[]>([]);
  clients = signal<any[]>([]);
  tasks = signal<any[]>([]);
  checklists = signal<any[]>([]);
  // Optimized: server-side stat counts
  dashboardStats = signal<any>(null);


  filteredRoleClients = computed(() => this.filterByRole(this.clients(), 'client'));
  filteredRoleTasks = computed(() => this.filterByRole(this.tasks(), 'task'));
  filteredRoleChecklists = computed(() => this.filterByRole(this.checklists(), 'checklist'));
  filteredRoleOrders = computed(() => this.filterByRole(this.orders(), 'order'));
  filteredRoleReminders = computed(() => this.filterByRole(this.complianceReminders(), 'reminder'));

  filterByRole(data: any[], type: 'client' | 'task' | 'checklist' | 'order' | 'reminder'): any[] {
    const user = this.user();
    if (!user) return data;
    const role = (user.role || '').toLowerCase();
    const userId = user._id || user.id || user.uid;

    if (role === 'admin' || role === 'account_manager') {
      return data;
    }

    if (role === 'client_manager') {
      const allowedClientIds = this.clients().filter(c => c.assigned_to === userId || c.client_manager === userId || c.created_by === userId || (c.assigned_to && c.assigned_to._id === userId) || (c.client_manager && c.client_manager._id === userId) || (c.created_by && c.created_by._id === userId)).map(c => c._id);
      if (type === 'client') return data.filter(c => c.assigned_to === userId || c.client_manager === userId || c.created_by === userId || (c.assigned_to && c.assigned_to._id === userId) || (c.client_manager && c.client_manager._id === userId) || (c.created_by && c.created_by._id === userId));
      if (type === 'task') return data.filter(t => allowedClientIds.includes(typeof t.client_id === 'object' ? t.client_id?._id : t.client_id));
      if (type === 'checklist') return data.filter(c => allowedClientIds.includes(typeof c.client_id === 'object' ? c.client_id?._id : c.client_id));
      if (type === 'order') return data.filter(o => allowedClientIds.includes(typeof o.client_id === 'object' ? o.client_id?._id : o.client_id));
    }

    if (role === 'filing_staff' || role === 'filling_staff') {
      if (type === 'task') return data.filter(t => {
        const tid = typeof t.assigned_to === 'object' ? t.assigned_to?._id : t.assigned_to;
        return tid === userId;
      });
      if (type === 'checklist') return data.filter(c => {
        const cid = typeof c.assigned_to === 'object' ? c.assigned_to?._id : c.assigned_to;
        return cid === userId;
      });
      return data;
    }

    return data;
  }



  upcomingDueTasks = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const checklists = this.filteredRoleChecklists().filter(c => {
      // Must have a dueDate and not be completed
      if (c.status === 'completed' || !c.dueDate) return false;
      
      if (!q) return true;
      
      const serviceName = (c.service_name || '').toLowerCase();
      const applicantName = (c.details?.['Applicant Name'] || '').toLowerCase();
      const entityName = (c.details?.['entityName'] || '').toLowerCase();
      
      return serviceName.includes(q) || applicantName.includes(q) || entityName.includes(q);
    });

    // Sort by dueDate (closest first)
    return checklists.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });
  });

  isOverdue(dateString: string): boolean {
    if (!dateString) return false;
    return new Date(dateString).getTime() < new Date().setHours(0,0,0,0);
  }

  isSearching = computed(() => {
    return this.searchQuery().trim().length > 0;
  });

  stats: any[] = [
    { title: 'Active Services', value: '0', detail: 'No in process services', isTrendUp: true },
    { title: 'Compliance Score', value: '100%', detail: 'Excellent Standing', isTrendUp: true },
    { title: 'Open Audit Tasks', value: '0', detail: 'All caught up', isGood: true },
    { title: 'Actions Pending', value: '0', detail: 'All clear', isGood: true }
  ];

  constructor(private api: Api) {
    this.generateAvailableMonths();
  }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        this.user.set(parsedUser);
        
        // Fetch full profile to ensure manager and admin info is up to date
        const userId = parsedUser._id || parsedUser.id || parsedUser.uid;
        if (userId) {
          this.api.get<any>(`users/profile/${userId}`).subscribe({
            next: (res) => {
              if (res && res.user) {
                this.user.set(res.user);
              }
            },
            error: (err) => console.error('Failed to fetch full user profile', err)
          });
        }
        
        // Use cache if data is fresh (less than 1 minute old)
        if (Date.now() - homeOverviewCache.lastFetchTime < 60000 && homeOverviewCache.clients) {
          this.clients.set(homeOverviewCache.clients || []);
          this.tasks.set(homeOverviewCache.tasks || []);
          this.checklists.set(homeOverviewCache.checklists || []);
          if (parsedUser.role === 'admin' || parsedUser.role === 'client_manager' || parsedUser.role === 'account_manager' || parsedUser.role === 'filing_staff' || parsedUser.role === 'filling_staff') {
            this.complianceReminders.set(homeOverviewCache.reminders || []);
            this.orders.set(homeOverviewCache.orders || []);
          }
          this.updateStats();
          this.isLoading.set(false);
        } else {
          // Optimized: fetch stat counts from a single endpoint
          this.fetchDashboardStats();

          // Still fetch full data for charts (clients, tasks, checklists)
          let expectedCalls = 3;
          let completedCalls = 0;
          
          const isAdminOrManager = parsedUser.role === 'admin' || parsedUser.role === 'client_manager' || parsedUser.role === 'account_manager' || parsedUser.role === 'filing_staff' || parsedUser.role === 'filling_staff';
          if (isAdminOrManager) {
            expectedCalls = 4;
          }

          const checkDone = () => {
            completedCalls++;
            if (completedCalls >= expectedCalls) {
              this.isLoading.set(false);
              homeOverviewCache.lastFetchTime = Date.now();
            }
          };

          this.fetchClients(checkDone);
          this.fetchTasks(checkDone);
          this.fetchChecklists(checkDone);
          
          if (isAdminOrManager) {
            this.fetchCompanyComplianceReminders(checkDone);
          }
        }
      } catch (e) {
        console.error('Failed to parse user in HomeOverview:', e);
        this.isLoading.set(false);
      }
    } else {
      this.isLoading.set(false);
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

  getTotalServicesCount(): number {
    return this.filteredRoleClients().reduce((acc, c) => acc + (c.services?.length || 0), 0);
  }

  fetchClients(callback?: () => void) {
    this.api.get<any>('users/clients/summary').subscribe({
      next: (res) => {
        if (res && res.clients) {
          this.clients.set(res.clients);
          homeOverviewCache.clients = res.clients;
          this.updateStats();
          this.initOrUpdateCharts();
        }
        if (callback) callback();
      },
      error: () => { if (callback) callback(); }
    });
  }

  fetchTasks(callback?: () => void) {
    this.api.get<any>('tasks').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.tasks.set(res.tasks);
          homeOverviewCache.tasks = res.tasks;
          this.updateStats();
          this.initOrUpdateCharts();
        }
        if (callback) callback();
      },
      error: () => { if (callback) callback(); }
    });
  }

  fetchChecklists(callback?: () => void) {
    this.api.get<any>('checklists/summary').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.checklists.set(res.checklists);
          homeOverviewCache.checklists = res.checklists;
          this.updateStats();
          this.initOrUpdateCharts();
        }
        if (callback) callback();
      },
      error: () => { if (callback) callback(); }
    });
  }

  fetchCompanyComplianceReminders(callback?: () => void) {
    this.api.get<any>('compliance/tasks/all').subscribe({
      next: (res) => {
        if (res && res.tasks) {
          const mappedReminders = res.tasks.map((t: any) => ({
            _id: t._id,
            title: t.title || t.checklistId?.service_name || 'Compliance Task',
            dueDate: t.dueDate,
            daysLeft: t.daysLeft,
            status: t.status === 'Completed' ? 'completed' : 
                    (t.daysLeft <= 0 ? 'expired' : (t.daysLeft <= 7 ? 'urgent' : 'upcoming')),
            entityName: t.entityName,
            client_id: {
              owner_name: t.clientUid?.owner_name || 'Client',
              company_name: t.clientUid?.company_name || 'Individual',
              client_manager: this.user()?.role === 'client_manager' ? (this.user()?._id || this.user()?.id) : null
            }
          }));
          this.complianceReminders.set(mappedReminders);
          homeOverviewCache.reminders = mappedReminders;
          this.updateStats();
          this.initOrUpdateCharts();
        }
        if (callback) callback();
      },
      error: () => { if (callback) callback(); }
    });
  }

  fetchCompanyOrders(callback?: () => void) {
    const companyId = this.getCompanyId();
    if (!companyId) {
      if (callback) callback();
      return;
    }
    this.api.get<any>(`orders/company/${companyId}`).subscribe({
      next: (res) => {
        if (res && res.orders) {
          this.orders.set(res.orders);
          homeOverviewCache.orders = res.orders;
          this.updateStats();
          this.initOrUpdateCharts();
        }
        if (callback) callback();
      },
      error: () => { if (callback) callback(); }
    });
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
    if (this.upscalingChartInstance) {
      this.upscalingChartInstance.destroy();
      this.upscalingChartInstance = null;
    }
  }

  selectedPeriod = signal<string>('last6Months');
  growthChartPeriod = signal<'1w' | '1m' | '1y'>('1w');
  activeChartView = signal<'tasks' | 'upscaling'>('tasks');

  toggleChartView() {
    const next = this.activeChartView() === 'tasks' ? 'upscaling' : 'tasks';
    this.activeChartView.set(next);
    // Re-render the relevant chart after Angular has updated the DOM
    setTimeout(() => {
      if (next === 'upscaling') {
        this.updateUpscalingChart();
      } else {
        this.updateGrowthChart();
      }
    }, 50);
  }

  setGrowthPeriod(period: '1w' | '1m' | '1y') {
    this.growthChartPeriod.set(period);
    this.updateGrowthChart();
  }

  financialMonth = signal<string>(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
  availableMonths: { value: string, label: string }[] = [];

  generateAvailableMonths() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const val = `${year}-${monthStr}`;
      const lbl = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      months.push({ value: val, label: lbl });
    }
    this.availableMonths = months;
  }

  getFinancialMonthLabel(): string {
    const m = this.availableMonths.find(x => x.value === this.financialMonth());
    return m ? m.label : this.financialMonth();
  }

  setFinancialMonth(val: string) {
    this.financialMonth.set(val);
    // Refetch server-side financial stats for the new month
    this.fetchDashboardStats();
  }

  financialTotals = computed(() => {
    // Use server-side financial totals if available (optimized)
    const serverStats = this.dashboardStats();
    if (serverStats?.financial) {
      return {
        totalRevenue: serverStats.financial.totalRevenue,
        amountReceived: serverStats.financial.amountReceived,
        pendingAmount: serverStats.financial.pendingAmount,
        // Detail breakdowns still derived client-side from orders for the tooltip popovers
        revenueDetails: [],
        receivedDetails: [],
        pendingDetails: []
      };
    }

    // Fallback: compute from locally cached orders (same logic as before)
    const monthStr = this.financialMonth();
    const ordersList = this.filteredRoleOrders() || [];
    let totalRev = 0;
    let amtRecv = 0;
    const revenueDetails: any[] = [];
    const receivedDetails: any[] = [];
    const pendingDetails: any[] = [];
    ordersList.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const oMonthStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (oMonthStr === monthStr) {
        const rev = o.dealClosedAmount || 0;
        const recv = o.advanceAmountPaid || 0;
        const pend = rev - recv;
        totalRev += rev;
        amtRecv += recv;
        const clientName = o.entityName || o.companyName || 'Unknown Client';
        const serviceName = o.serviceType || 'Service';
        if (rev > 0) revenueDetails.push({ clientName, serviceName, amount: rev });
        if (recv > 0) receivedDetails.push({ clientName, serviceName, amount: recv });
        if (pend > 0) pendingDetails.push({ clientName, serviceName, amount: pend });
      }
    });
    return { totalRevenue: totalRev, amountReceived: amtRecv, pendingAmount: totalRev - amtRecv, revenueDetails, receivedDetails, pendingDetails };
  });

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

  isExportModalOpen = false;
  exportStartDate = '';
  exportEndDate = '';

  openExportModal() {
    this.isExportModalOpen = true;
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    this.exportEndDate = today.toISOString().split('T')[0];
    this.exportStartDate = lastMonth.toISOString().split('T')[0];
  }

  closeExportModal() {
    this.isExportModalOpen = false;
  }

  confirmExport() {
    if (!this.exportStartDate || !this.exportEndDate) return;

    const start = new Date(this.exportStartDate);
    start.setHours(0,0,0,0);
    const end = new Date(this.exportEndDate);
    end.setHours(23,59,59,999);

    if (start > end) {
      alert('Start date must be before end date.');
      return;
    }

    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const labels = dates.map(d => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    });
    const totalTasks = new Array(dates.length).fill(0);
    const completedTasks = new Array(dates.length).fill(0);
    const revenue = new Array(dates.length).fill(0);
    const clients = new Array(dates.length).fill(0);

    this.filteredRoleTasks().forEach(task => {
      if (!task.createdAt) return;
      const created = new Date(task.createdAt);
      if (created >= start && created <= end) {
        const diffDays = Math.floor((created.getTime() - start.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays < dates.length) {
          totalTasks[diffDays]++;
          if (task.status === 'Completed' || task.status === 'Approved') {
            completedTasks[diffDays]++;
          }
        }
      }
    });

    this.filteredRoleChecklists().forEach(checklist => {
      if (!checklist.createdAt) return;
      const created = new Date(checklist.createdAt);
      if (created >= start && created <= end) {
        const diffDays = Math.floor((created.getTime() - start.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays < dates.length) {
          totalTasks[diffDays]++;
          if (checklist.status === 'completed') {
            completedTasks[diffDays]++;
          }
        }
      }
    });

    this.filteredRoleClients().forEach(client => {
      if (!client.createdAt) return;
      const created = new Date(client.createdAt);
      if (created >= start && created <= end) {
        const diffDays = Math.floor((created.getTime() - start.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays < dates.length) {
          clients[diffDays]++;
          revenue[diffDays] += client.revenue || 0;
        }
      }
    });

    let csvContent = 'Date,Total Tasks,Completed Tasks,Revenue,Clients Onboarded\n';
    
    for (let i = 0; i < labels.length; i++) {
      const row = [
        labels[i],
        totalTasks[i],
        completedTasks[i],
        revenue[i],
        clients[i]
      ];
      csvContent += row.join(',') + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Custom_Export_${this.exportStartDate}_to_${this.exportEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.closeExportModal();
  }

  exportFinancialData() {
    const monthStrFilter = this.financialMonth();
    const ordersList = this.filteredRoleOrders() || [];
    
    let csvContent = 'Client Name,Service Name,Total Amount,Amount Received,Pending Amount,Inst 1 Amount,Inst 1 Date,Inst 2 Amount,Inst 2 Date,Inst 3 Amount,Inst 3 Date,Inst 4 Amount,Inst 4 Date,Inst 5 Amount,Inst 5 Date\n';

    let totalRevenueSum = 0;
    let totalReceivedSum = 0;
    let totalPendingSum = 0;

    ordersList.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const oMonthStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (oMonthStr === monthStrFilter) {
        const clientName = o.entityName || o.companyName || 'Unknown Client';
        const serviceName = o.serviceType || 'Service';
        const rev = o.dealClosedAmount || 0;
        const recv = o.advanceAmountPaid || 0;
        const pend = rev - recv;

        totalRevenueSum += rev;
        totalReceivedSum += recv;
        totalPendingSum += pend;
        
        let instCols = [];
        let logs = (o.financialLogs && Array.isArray(o.financialLogs)) ? o.financialLogs : [];
        
        for (let i = 0; i < 5; i++) {
          if (i < logs.length) {
            const log = logs[i];
            const dt = log.paymentTimestamp ? new Date(log.paymentTimestamp) : (log.addedAt ? new Date(log.addedAt) : null);
            const dateStr = dt ? dt.toLocaleDateString() : 'N/A';
            instCols.push(`${log.amount || 0}`);
            instCols.push(`"${dateStr}"`);
          } else {
            instCols.push('0');
            instCols.push('""');
          }
        }
        
        const safeClientName = `"${clientName.replace(/"/g, '""')}"`;
        const safeServiceName = `"${serviceName.replace(/"/g, '""')}"`;
        const instDetailsCsv = instCols.join(',');
        
        csvContent += `${safeClientName},${safeServiceName},${rev},${recv},${pend},${instDetailsCsv}\n`;
      }
    });

    // Add 2 blank rows
    csvContent += `,,,,,,,,,,,,,,\n`;
    csvContent += `,,,,,,,,,,,,,,\n`;

    // Add totals row at the bottom
    csvContent += `TOTAL,"",${totalRevenueSum},${totalReceivedSum},${totalPendingSum},,,,,,,,,,\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Financial_Export_${monthStrFilter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  initOrUpdateCharts() {
    // Only construct if at least one canvas element is available in the DOM
    if (!this.growthChartCanvas && !this.revenueChartCanvas && !this.activityChartCanvas) {
      return;
    }

    this.destroyCharts();
    this.updateGrowthChart();

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

        this.filteredRoleTasks().forEach(t => {
          if (!t.createdAt) return;
          const time = new Date(t.createdAt).getTime();
          if (time >= start && time <= end) {
            tasksCreated++;
            if (t.status === 'Completed' || t.status === 'Approved') tasksCompleted++;
          }
        });

        this.filteredRoleChecklists().forEach(c => {
          if (!c.createdAt) return;
          const time = new Date(c.createdAt).getTime();
          if (time >= start && time <= end) {
            tasksCreated++;
            if (c.status === 'completed') tasksCompleted++;
          }
        });

        this.filteredRoleClients().forEach(client => {
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

        this.filteredRoleTasks().forEach(t => {
          if (!t.createdAt) return;
          const time = new Date(t.createdAt).getTime();
          if (time >= bounds.start && time <= bounds.end) {
            tasksCreated++;
            if (t.status === 'Completed' || t.status === 'Approved') tasksCompleted++;
          }
        });

        this.filteredRoleChecklists().forEach(c => {
          if (!c.createdAt) return;
          const time = new Date(c.createdAt).getTime();
          if (time >= bounds.start && time <= bounds.end) {
            tasksCreated++;
            if (c.status === 'completed') tasksCompleted++;
          }
        });

        this.filteredRoleClients().forEach(client => {
          if (!client.createdAt) return;
          const time = new Date(client.createdAt).getTime();
          if (time >= bounds.start && time <= bounds.end) {
            clientsCount++;
          }
        });

        this.filteredRoleOrders().forEach(order => {
          const time = (order.updatedAt ? new Date(order.updatedAt) : (order.createdAt ? new Date(order.createdAt) : new Date())).getTime();
          if (time >= bounds.start && time <= bounds.end) {
            const amt = Number(order.dealClosedAmount) || Number(order.deal_closed_amount) || 0;
            revSum += amt;
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

      this.filteredRoleTasks().forEach(task => {
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

      this.filteredRoleChecklists().forEach(checklist => {
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
      this.filteredRoleOrders().forEach(order => {
        const createdDate = order.updatedAt ? new Date(order.updatedAt) : (order.createdAt ? new Date(order.createdAt) : new Date());
        const diffMonths = (now.getMonth() - createdDate.getMonth()) + (now.getFullYear() - createdDate.getFullYear()) * 12;
        if (diffMonths >= 0 && diffMonths < 6) {
          const index = 5 - diffMonths;
          const amt = Number(order.dealClosedAmount) || Number(order.deal_closed_amount) || 0;
          revenueByMonth[index] += amt;
        }
      });
      revenueDataPoints = revenueByMonth;

      const clientCountByMonth = [0, 0, 0, 0, 0, 0];
      this.filteredRoleClients().forEach(client => {
        const createdDate = client.createdAt ? new Date(client.createdAt) : new Date();
        const diffMonths = (now.getMonth() - createdDate.getMonth()) + (now.getFullYear() - createdDate.getFullYear()) * 12;
        if (diffMonths >= 0 && diffMonths < 6) {
          const index = 5 - diffMonths;
          clientCountByMonth[index]++;
        }
      });
      clientActivityPoints = clientCountByMonth;
    }

    if (revenueDataPoints.length > 1) {
      const current = revenueDataPoints[revenueDataPoints.length - 1];
      const previous = revenueDataPoints[revenueDataPoints.length - 2];
      if (previous > 0) {
        const growth = ((current - previous) / previous) * 100;
        this.revenueTrendUp.set(growth >= 0);
        this.revenueGrowth.set(`${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`);
      } else if (current > 0) {
        this.revenueTrendUp.set(true);
        this.revenueGrowth.set('+100.0%');
      } else {
        this.revenueTrendUp.set(true);
        this.revenueGrowth.set('+0.0%');
      }
    }

    const chartConfigDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { display: false },
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } }
      }
    };

    // The growthChart is now handled by updateGrowthChart()

    if (this.revenueChartCanvas?.nativeElement) {
      const ctxRevenue = this.revenueChartCanvas.nativeElement.getContext('2d');
      if (ctxRevenue) {
        const hRevenue = ctxRevenue.canvas.height || 300;
        const gradientBar = ctxRevenue.createLinearGradient(0, 0, 0, hRevenue);
        gradientBar.addColorStop(0, '#312e81');
        gradientBar.addColorStop(1, '#1e1b4b');

        this.revenueChartInstance = new Chart(ctxRevenue, {
          type: 'bar',
          data: {
            labels: chartLabels,
            datasets: [{ 
              data: revenueDataPoints,
              backgroundColor: gradientBar,
              borderRadius: 4
            }]
          },
          options: chartConfigDefaults
        });
      }
    }

    if (this.activityChartCanvas?.nativeElement) {
      const ctxActivity = this.activityChartCanvas.nativeElement.getContext('2d');
      if (ctxActivity) {
        const wActivity = ctxActivity.canvas.width || 600;
        const hActivity = ctxActivity.canvas.height || 300;
        const gradientLine3 = ctxActivity.createLinearGradient(0, 0, wActivity, 0);
        gradientLine3.addColorStop(0, '#1e1b4b');
        gradientLine3.addColorStop(1, '#1e1b4b');

        const gradientFill = ctxActivity.createLinearGradient(0, 0, 0, hActivity);
        gradientFill.addColorStop(0, 'rgba(49, 46, 129, 0.3)');
        gradientFill.addColorStop(1, 'rgba(30, 27, 75, 0.0)');

        this.activityChartInstance = new Chart(ctxActivity, {
          type: 'line',
          data: {
            labels: chartLabels,
            datasets: [
              { label: 'Clients Onboarded', data: clientActivityPoints, fill: true, backgroundColor: gradientFill, borderColor: gradientLine3, borderWidth: 2, tension: 0.4, pointRadius: 0 }
            ]
          },
          options: chartConfigDefaults
        });
      }
    }

    // Upscaling Chart
    this.updateUpscalingChart();
  }

  getAssigneeName(cl: any): string {
    if (!cl || !cl.assigned_to) {
      return 'Yet to Assign';
    }
    return cl.assigned_to.owner_name || cl.assigned_to.name || 'Yet to Assign';
  }

  // ─── Upscaling / Opportunities ───────────────────────────────────────────────

  readonly RECOMMENDATION_POOL = [
    { category: 'Incorporation', name: 'Private Limited Incorporation' },
    { category: 'Incorporation', name: 'LLP Incorporation' },
    { category: 'Incorporation', name: 'OPC' },
    { category: 'Incorporation', name: 'MSME' },
    { category: 'Incorporation', name: 'Proprietorship' },
    { category: 'Compliance', name: 'MCA Compliance' },
    { category: 'Compliance', name: 'TDS' },
    { category: 'Compliance', name: 'PF' },
    { category: 'IP', name: 'Copyright' },
    { category: 'IP', name: 'Trade Mark' },
    { category: 'IP', name: 'Patent' },
    { category: 'Tax', name: 'GST filing' },
    { category: 'Tax', name: 'GST Cancelation' },
    { category: 'Tax', name: 'ITR' },
    { category: 'Tax', name: 'GST Registration' },
    { category: 'Licensing', name: 'DPIIT' },
    { category: 'Licensing', name: 'ISO' },
    { category: 'Licensing', name: 'FSSAI' },
    { category: 'Licensing', name: 'DSC' },
    { category: 'Licensing', name: 'IE code' },
    { category: 'Licensing', name: 'LEI' },
    { category: 'Licensing', name: 'BIS' },
    { category: 'Licensing', name: 'RoHS' },
    { category: 'Licensing', name: 'CE' },
  ];

  getUpscalingDataForClients(): { label: string; done: number; remaining: number }[] {
    const primaryIncorpServices = ['Private Limited Incorporation', 'LLP Incorporation', 'OPC', 'Proprietorship'];
    const poolSize = this.RECOMMENDATION_POOL.length;

    return this.filteredRoleClients()
      .map(client => {
        const weDone = (client.we_services || [])
          .filter((s: any) => s.status === 'completed' || s.status === 'complete' || s.stage === 'completed')
          .map((s: any) => s.serviceName as string);
        const outsourced = (client.outsourced_services || []).map((s: any) => s.serviceName as string);
        const doneSet = new Set([...weDone, ...outsourced]);
        const hasPrimaryIncorp = primaryIncorpServices.some(s => doneSet.has(s));

        const remaining = this.RECOMMENDATION_POOL.filter(s => {
          if (doneSet.has(s.name)) return false;
          if (hasPrimaryIncorp && primaryIncorpServices.includes(s.name)) return false;
          return true;
        }).length;

        const done = poolSize - remaining;
        const label = (client.company_name || client.name || 'Client').substring(0, 18);
        return { label, done, remaining };
      })
      .filter(d => d.done > 0 || d.remaining > 0)
      .sort((a, b) => b.done - a.done)
      .slice(0, 10); // top 10 clients
  }

  upscalingSummary = computed(() => {
    const data = this.getUpscalingDataForClients();
    const totalDone = data.reduce((s, d) => s + d.done, 0);
    const totalRemaining = data.reduce((s, d) => s + d.remaining, 0);
    const total = totalDone + totalRemaining;
    const conversionRate = total > 0 ? Math.round((totalDone / total) * 100) : 0;
    return { totalDone, totalOpps: totalRemaining, conversionRate };
  });

  updateUpscalingChart() {
    if (!this.upscalingChartCanvas?.nativeElement) return;

    if (this.upscalingChartInstance) {
      this.upscalingChartInstance.destroy();
      this.upscalingChartInstance = null;
    }

    const ctx = this.upscalingChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.getUpscalingDataForClients();
    if (data.length === 0) return;

    this.upscalingChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [
          {
            label: 'Done via WE',
            data: data.map(d => d.done),
            backgroundColor: '#6366f1',
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Remaining Opportunities',
            data: data.map(d => d.remaining),
            backgroundColor: '#e2e8f0',
            borderRadius: 5,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}`
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11 }, color: '#64748b' }
          },
          y: {
            stacked: true,
            display: false,
            grid: { display: false }
          }
        }
      }
    });
  }

  isActionRequired(c: any): boolean {
    if (!c) return false;
    const serviceNameLower = (c.service_name || '').toLowerCase();
    const SERVICES_WITH_FORMS = [
      'dpiit', 'duns', 'private limited', 'trade mark', 'trademark', 'copyright', 'llp', 'msme', 'gst', 'iso', 'fssai', 
      'one person company', 'opc', 'lei', 'lie', 'bis', 'mca', 'dsc', 'iec', 'proprietorship', 'tds', 'pan, tan', 'itr', 'pf', 'patent', 'ce', 'rohs'
    ];
    
    const requiresForm = SERVICES_WITH_FORMS.some(s => serviceNameLower.includes(s));
    
    if (requiresForm) {
      if (c.details?.clientFormSubmitted) {
        return false;
      }

      const formFillingStep = c.items?.find((item: any) => item.isActionStep);
      if (formFillingStep?.isChecked) {
        return false;
      }

      // These are system-injected fields set at checklist creation time, NOT from client form submission
      const SYSTEM_FIELDS = new Set([
        'entityname', 'status', 'next step', 'applicant name', 'applicant email',
        'applicant phone', 'badge', 'requesttype', 'recommended_plan', 'service_fee'
      ]);

      let isFormFilled = false;
      if (c.details && typeof c.details === 'object') {
        const clientKeys = Object.keys(c.details).filter(k => !SYSTEM_FIELDS.has(k.toLowerCase()));
        // Consider form filled only if there are actual client-submitted keys beyond system fields
        isFormFilled = clientKeys.length > 0;
      }
      return !isFormFilled;
    }
    
    return false;
  }

  isDocumentPending(c: any): boolean {
    if (c.requested_documents && Array.isArray(c.requested_documents)) {
      return c.requested_documents.some((d: any) => !d.isUploaded);
    }
    return false;
  }

  getChecklistDisplayStatus(c: any): string {
    if (!c) return 'Pending';
    if (c.status === 'completed') return 'Completed';
    
    const assigneeName = this.getAssigneeName(c);
    const isAssigned = assigneeName !== 'Yet to Assign';

    if (isAssigned) {
      if (this.isActionRequired(c)) {
        return 'Action Required';
      } else {
        return 'In Progress';
      }
    }

    return 'Pending';
  }

  totalOpportunities = signal<number>(0);

  recommendationPool = [
    { category: 'Incorporation', name: 'Private Limited Incorporation' },
    { category: 'Incorporation', name: 'LLP Incorporation' },
    { category: 'Incorporation', name: 'OPC' },
    { category: 'Incorporation', name: 'MSME' },
    { category: 'Incorporation', name: 'Proprietorship' },
    { category: 'Compliance', name: 'MCA Compliance' },
    { category: 'Compliance', name: 'TDS' },
    { category: 'Compliance', name: 'PF' },
    { category: 'IP', name: 'Copyright' },
    { category: 'IP', name: 'Trade Mark' },
    { category: 'IP', name: 'Patent' },
    { category: 'Tax', name: 'GST filing' },
    { category: 'Tax', name: 'GST Cancelation' },
    { category: 'Tax', name: 'ITR' },
    { category: 'Tax', name: 'GST Registration' },
    { category: 'Licensing', name: 'DPIIT' },
    { category: 'Licensing', name: 'ISO' },
    { category: 'Licensing', name: 'FSSAI' },
    { category: 'Licensing', name: 'DSC' },
    { category: 'Licensing', name: 'IE code' },
    { category: 'Licensing', name: 'LEI' },
    { category: 'Licensing', name: 'BIS' },
    { category: 'Licensing', name: 'RoHS' },
    { category: 'Licensing', name: 'CE' },
    { category: 'Compliance', name: 'ISO Certification' },
    { category: 'Compliance', name: 'FSSAI Registration' }
  ];

  fetchOpportunitiesCount() {
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          let totalOpp = 0;
          for (const client of res.clients) {
            const weDone = (client.we_services || []).filter((s: any) => s.status === 'completed' || s.status === 'complete' || s.stage === 'completed').map((s: any) => s.serviceName);
            const outsourced = (client.outsourced_services || []).map((s: any) => s.serviceName);
            const doneSet = new Set([...weDone, ...outsourced]);
            
            const primaryIncorpServices = ['Private Limited Incorporation', 'LLP Incorporation', 'OPC', 'Proprietorship'];
            const hasPrimaryIncorp = primaryIncorpServices.some(s => doneSet.has(s));

            const oppsForClient = this.recommendationPool.filter(s => {
              if (doneSet.has(s.name)) return false;
              if (hasPrimaryIncorp && primaryIncorpServices.includes(s.name)) return false;
              return true;
            });
            totalOpp += oppsForClient.length;
          }
          this.totalOpportunities.set(totalOpp);
          this.updateStats(); // Refresh the UI cards with the new count
        }
      },
      error: (err) => console.error('[fetchOpportunitiesCount] Failed:', err)
    });
  }

  // Fetch all stat counts from a single optimized server endpoint
  fetchDashboardStats() {
    this.fetchOpportunitiesCount();
    const monthStr = this.financialMonth();
    this.api.get<any>(`dashboard/stats?month=${monthStr}`).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.dashboardStats.set(res);
          homeOverviewCache.dashboardStats = res;
          this.updateStats();
        }
      },
      error: (err) => console.error('[fetchDashboardStats] Failed:', err)
    });
  }

  updateStats() {
    const userRole = this.user()?.role;
    
    // Calculate Due Today using local checklists (as server stats doesn't provide it yet)
    const allLocal = this.filteredRoleChecklists();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueTodayCount = allLocal.filter(c => {
      if (!c.dueDate || c.status === 'completed') return false;
      const d = new Date(c.dueDate);
      return d >= today && d < tomorrow;
    }).length;

    // Prefer server-side stats for the rest (optimized path)
    const serverStats = this.dashboardStats()?.stats;
    if (serverStats) {
      const { allTasks, formsPending, docsPending, inProgress, forReview, completed, reopen } = serverStats;
      
      if (userRole === 'filling_staff' || userRole === 'filing_staff') {
        this.stats = [
          { title: 'All Tasks', value: String(allTasks), detail: 'Total active checklists', isTrendUp: true },
          { title: 'Due Today', value: String(dueTodayCount), detail: dueTodayCount > 0 ? 'Due for action today' : 'All clear', isWarning: dueTodayCount > 0, isGood: dueTodayCount === 0 },
          { title: 'In Progress', value: String(inProgress), detail: inProgress > 0 ? 'Currently being worked on' : 'None', isTrendUp: true },
          { title: 'Reopened', value: String(reopen || 0), detail: (reopen || 0) > 0 ? 'Needs your attention' : 'None', isWarning: (reopen || 0) > 0, isGood: (reopen || 0) === 0 },
          { title: 'Completed', value: String(completed || 0), detail: 'Finished by you', isGood: true }
        ];
      } else {
        this.stats = [
          { title: 'All Tasks', value: String(allTasks), detail: 'Total active checklists', isTrendUp: true },
          { title: 'Due Today', value: String(dueTodayCount), detail: dueTodayCount > 0 ? 'Due for action today' : 'All clear', isWarning: dueTodayCount > 0, isGood: dueTodayCount === 0 },
          { title: 'In Progress', value: String(inProgress), detail: inProgress > 0 ? 'Currently being worked on' : 'None', isTrendUp: true },
          { title: 'For Review', value: String(forReview), detail: forReview > 0 ? 'Ready for manager review' : 'None', isTrendUp: true },
          { title: 'Opportunities', value: String(this.totalOpportunities()), detail: 'Total available services', isTrendUp: true }
        ];
      }
      return;
    }

    // Fallback: compute locally from checklists (if server call not yet resolved)
    const all = this.filteredRoleChecklists();
    const allTasksCount = all.length;
    const inProgressCount = all.filter(c => this.getChecklistDisplayStatus(c) === 'In Progress' && c.status !== 'under_review').length;
    const forReviewCount = all.filter(c => c.status === 'under_review').length;
    const completedCount = all.filter(c => c.status === 'completed').length;
    const reopenCount = all.filter(c => c.status === 'reopen').length;
    
    if (userRole === 'filling_staff' || userRole === 'filing_staff') {
      this.stats = [
        { title: 'All Tasks', value: String(allTasksCount), detail: 'Total active checklists', isTrendUp: true },
        { title: 'Due Today', value: String(dueTodayCount), detail: dueTodayCount > 0 ? 'Due for action today' : 'All clear', isWarning: dueTodayCount > 0, isGood: dueTodayCount === 0 },
        { title: 'In Progress', value: String(inProgressCount), detail: inProgressCount > 0 ? 'Currently being worked on' : 'None', isTrendUp: true },
        { title: 'Reopened', value: String(reopenCount), detail: reopenCount > 0 ? 'Needs your attention' : 'None', isWarning: reopenCount > 0, isGood: reopenCount === 0 },
        { title: 'Completed', value: String(completedCount), detail: 'Finished by you', isGood: true }
      ];
    } else {
      this.stats = [
        { title: 'All Tasks', value: String(allTasksCount), detail: 'Total active checklists', isTrendUp: true },
        { title: 'Due Today', value: String(dueTodayCount), detail: dueTodayCount > 0 ? 'Due for action today' : 'All clear', isWarning: dueTodayCount > 0, isGood: dueTodayCount === 0 },
        { title: 'In Progress', value: String(inProgressCount), detail: inProgressCount > 0 ? 'Currently being worked on' : 'None', isTrendUp: true },
        { title: 'For Review', value: String(forReviewCount), detail: forReviewCount > 0 ? 'Ready for manager review' : 'None', isTrendUp: true },
        { title: 'Opportunities', value: String(this.totalOpportunities()), detail: 'Total available services', isTrendUp: true }
      ];
    }
  }

  updateGrowthChart() {
    if (!this.growthChartCanvas?.nativeElement) return;
    
    if (this.growthChartInstance) {
      this.growthChartInstance.destroy();
      this.growthChartInstance = null;
    }

    const ctxGrowth = this.growthChartCanvas.nativeElement.getContext('2d');
    if (!ctxGrowth) return;

    let labels: string[] = [];
    let currentData: number[] = [];
    let previousData: number[] = [];
    let currentLabel = '';
    let previousLabel = '';
    const now = new Date();
    const p = this.growthChartPeriod();

    const tasks = this.filteredRoleTasks();
    const checklists = this.filteredRoleChecklists();

    const getCount = (start: number, end: number) => {
      let count = 0;
      tasks.forEach(t => {
        if (t.createdAt) {
          const time = new Date(t.createdAt).getTime();
          if (time >= start && time <= end) count++;
        }
      });
      checklists.forEach(c => {
        if (c.createdAt) {
          const time = new Date(c.createdAt).getTime();
          if (time >= start && time <= end) count++;
        }
      });
      return count;
    };

    if (p === '1w') {
      currentLabel = 'This Week';
      previousLabel = 'Last Week';
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        labels[6 - i] = d.toLocaleString('default', { weekday: 'short' });
        
        const startCurr = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
        const endCurr = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();
        currentData.push(getCount(startCurr, endCurr));

        const startPrev = startCurr - 7 * 24 * 60 * 60 * 1000;
        const endPrev = endCurr - 7 * 24 * 60 * 60 * 1000;
        previousData.push(getCount(startPrev, endPrev));
      }
    } else if (p === '1m') {
      currentLabel = 'This Month';
      previousLabel = 'Last Month';
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const prevMonth = prevMonthDate.getMonth();
      const prevYear = prevMonthDate.getFullYear();

      const getWeekBounds = (year: number, month: number) => [
        { start: new Date(year, month, 1).getTime(), end: new Date(year, month, 7, 23, 59, 59).getTime() },
        { start: new Date(year, month, 8).getTime(), end: new Date(year, month, 14, 23, 59, 59).getTime() },
        { start: new Date(year, month, 15).getTime(), end: new Date(year, month, 21, 23, 59, 59).getTime() },
        { start: new Date(year, month, 22).getTime(), end: new Date(year, month, 31, 23, 59, 59).getTime() }
      ];

      const currBounds = getWeekBounds(currentYear, currentMonth);
      const prevBounds = getWeekBounds(prevYear, prevMonth);

      for (let i = 0; i < 4; i++) {
        currentData.push(getCount(currBounds[i].start, currBounds[i].end));
        previousData.push(getCount(prevBounds[i].start, prevBounds[i].end));
      }
    } else {
      currentLabel = 'This Year';
      previousLabel = 'Last Year';
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = now.getFullYear();
      for (let i = 0; i < 12; i++) {
        const startCurr = new Date(currentYear, i, 1).getTime();
        const endCurr = new Date(currentYear, i + 1, 0, 23, 59, 59).getTime(); // last day of month
        currentData.push(getCount(startCurr, endCurr));

        const startPrev = new Date(currentYear - 1, i, 1).getTime();
        const endPrev = new Date(currentYear - 1, i + 1, 0, 23, 59, 59).getTime();
        previousData.push(getCount(startPrev, endPrev));
      }
    }

    const hGrowth = ctxGrowth.canvas.height || 350;
    const gradientFill = ctxGrowth.createLinearGradient(0, 0, 0, hGrowth);
    gradientFill.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
    gradientFill.addColorStop(1, 'rgba(34, 197, 94, 0)');

    this.growthChartInstance = new Chart(ctxGrowth, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: currentLabel,
            data: currentData,
            borderColor: '#22c55e', // solid green
            backgroundColor: gradientFill,
            fill: true,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0
          },
          {
            label: previousLabel,
            data: previousData,
            borderColor: '#94a3b8', // dashed gray
            borderDash: [5, 5],
            fill: false,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: true, 
            position: 'bottom',
            labels: { usePointStyle: false, boxWidth: 16, boxHeight: 2, padding: 20 } 
          } 
        },
        scales: {
          y: { display: false, min: 0 },
          x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 12 }, color: '#64748b' } }
        }
      }
    });
  }

  @Output() navigateTab = new EventEmitter<{tab: string, filter?: string, priority?: string}>();

  handleMetricCardClick(statTitle: string) {
    if (statTitle === 'Opportunities') {
      this.navigateTab.emit({ tab: 'opportunities' });
    } else if (statTitle === 'All Tasks') {
      this.navigateTab.emit({ tab: 'checklists', filter: 'all' });
    } else if (statTitle === 'Due Today') {
      this.navigateTab.emit({ tab: 'checklists', filter: 'all', priority: 'High' });
    } else if (statTitle === 'In Progress') {
      this.navigateTab.emit({ tab: 'checklists', filter: 'in_progress' });
    } else if (statTitle === 'For Review') {
      this.navigateTab.emit({ tab: 'checklists', filter: 'under_review' });
    } else if (statTitle === 'Completed') {
      this.navigateTab.emit({ tab: 'checklists', filter: 'completed' });
    }
  }
}

