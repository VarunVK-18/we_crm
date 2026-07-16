import { ResizableColumnDirective } from '../../directives/resizable-column.directive';
import { Component, signal, computed, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Alert01Icon, CheckmarkCircle01Icon, Calendar02Icon, Search01Icon, ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-staff-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent, ResizableColumnDirective],
  templateUrl: './staff-compliance.html',
  styleUrl: './staff-compliance.css'
})
export class StaffCompliance implements OnInit {
  readonly Alert01Icon = Alert01Icon;
  readonly CheckmarkCircle01Icon = CheckmarkCircle01Icon;
  readonly Calendar02Icon = Calendar02Icon;
  readonly Search01Icon = Search01Icon;
  readonly ArrowDown01Icon = ArrowDown01Icon;
  readonly ArrowUp01Icon = ArrowUp01Icon;

  tasks = signal<any[]>([]);
  isLoading = signal(true);
  
  // Column Filters
  searchQuery = signal<string>('');
  serviceIdFilter = signal<string>('');
  clientIdFilter = signal<string>('');
  clientNameFilter = signal<string>('');
  entityFilter = signal<string>('');
  taskFilter = signal<string>('');
  
  // Tab Filter
  currentTab = signal<string>('all');
  
  // Pagination (Optional but good to have)
  currentPage = signal(1);
  pageSize = signal(15);
  
  // File Upload State for Complete Task
  selectedTask = signal<any>(null);
  isCompleteModalOpen = signal(false);
  proofDocument: File | null = null;
  certificateDocument: File | null = null;
  acknowledgementDocument: File | null = null;

  filteredTasks = computed(() => {
    let all = this.tasks();

    const globalQ = this.searchQuery().toLowerCase();
    const clientQ = this.clientIdFilter().toLowerCase();
    const entityQ = this.entityFilter().toLowerCase();
    const taskQ = this.taskFilter().toLowerCase();
    const tab = this.currentTab();

    return all.filter(t => {
      const clientDetails = t.clientDetails || t.clientUid || {};
      const searchStr = `${t.entityName} ${t.title} ${t.checklistId?.custom_service_id || ''} ${clientDetails?.custom_client_id} ${clientDetails?.owner_name} ${clientDetails?.company_name}`.toLowerCase();
      const globalMatch = !globalQ || searchStr.includes(globalQ);

      const serviceIdQ = this.serviceIdFilter().toLowerCase();
      const serviceIdMatch = !serviceIdQ || (t.checklistId?.custom_service_id && t.checklistId.custom_service_id.toLowerCase().includes(serviceIdQ));

      const clientNameQ = this.clientNameFilter().toLowerCase();
      const clientNameMatch = !clientNameQ || 
        clientDetails?.owner_name?.toLowerCase().includes(clientNameQ) || 
        clientDetails?.name?.toLowerCase().includes(clientNameQ);

      const clientIdMatch = !clientQ ||
        clientDetails?.custom_client_id?.toLowerCase().includes(clientQ);

      const entityMatch = !entityQ || t.entityName?.toLowerCase().includes(entityQ);
      const taskMatch = !taskQ || t.title?.toLowerCase().includes(taskQ);

      let tabMatch = true;
      if (tab === 'upcoming') tabMatch = t.status === 'Upcoming';
      if (tab === 'due_soon') tabMatch = t.status === 'Due Soon';
      if (tab === 'critical') tabMatch = t.status === 'Critical';
      if (tab === 'overdue') tabMatch = t.status === 'Overdue';
      if (tab === 'completed') tabMatch = t.status === 'Completed';

      return globalMatch && serviceIdMatch && clientIdMatch && clientNameMatch && entityMatch && taskMatch && tabMatch;
    });
  });

  getTabCount(tab: string): number {
    const tasks = this.tasks();
    if (tab === 'all') return tasks.length;
    if (tab === 'upcoming') return tasks.filter(t => t.status === 'Upcoming').length;
    if (tab === 'due_soon') return tasks.filter(t => t.status === 'Due Soon').length;
    if (tab === 'critical') return tasks.filter(t => t.status === 'Critical').length;
    if (tab === 'overdue') return tasks.filter(t => t.status === 'Overdue').length;
    if (tab === 'completed') return tasks.filter(t => t.status === 'Completed').length;
    return 0;
  }

  groupedCompanies = computed(() => {
    const tasks = this.filteredTasks();
    const companyMap = new Map<string, any>();

    for (const t of tasks) {
      const key = t.entityName || 'Individual';
      if (!companyMap.has(key)) {
        const clientDetails = t.clientDetails || t.clientUid || {};
        companyMap.set(key, {
          entityName: key,
          clientUid: t.clientUid?._id || t.clientUid,
          clientDetails,
          totalTasks: 0,
          overdueTasks: 0,
          pendingTasks: 0,
          serviceIdsSet: new Set<string>()
        });
      }
      const group = companyMap.get(key);
      group.totalTasks++;
      if (t.daysLeft < 0) {
        group.overdueTasks++;
      } else if (t.status !== 'Completed') {
        group.pendingTasks++;
      }
      if (t.checklistId?.custom_service_id) {
        group.serviceIdsSet.add(t.checklistId.custom_service_id);
      }
    }

    return Array.from(companyMap.values()).map(g => ({
      ...g,
      serviceIds: Array.from(g.serviceIdsSet).join(', ') || '—'
    }));
  });

  paginatedCompanies = computed(() => {
    const companies = this.groupedCompanies();
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return companies.slice(startIndex, startIndex + this.pageSize());
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.groupedCompanies().length / this.pageSize()));
  });

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  hasActiveFilters = computed(() => {
    return this.clientIdFilter() || this.entityFilter() || this.taskFilter();
  });

  @Output() onViewDetails = new EventEmitter<{ entityName: string, clientUid: string }>();

  constructor(private api: Api) {}

  ngOnInit() {
    this.fetchAllTasks();
  }

  viewDetails(entityInfo: { entityName: string, clientUid: string }) {
    this.onViewDetails.emit(entityInfo);
  }

  fetchAllTasks() {
    this.api.get<any>('compliance/tasks/all').subscribe({
      next: (res: any) => {
        const fetched = res.tasks || [];
        const mapped = fetched.map((r: any) => ({
             ...r,
             id: r._id,
             entityName: r.entityName || 'Individual',
             message: r.daysLeft <= 0 ? 'Overdue - Penalty Applicable' : `Due in ${r.daysLeft} days`
        }));
        this.tasks.set(mapped);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to fetch compliance tasks:', err);
        this.isLoading.set(false);
      }
    });
  }

  openCompleteModal(task: any) {
    this.selectedTask.set(task);
    this.proofDocument = null;
    this.certificateDocument = null;
    this.acknowledgementDocument = null;
    this.isCompleteModalOpen.set(true);
  }

  onFileChange(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      if (type === 'proof') this.proofDocument = file;
      if (type === 'cert') this.certificateDocument = file;
      if (type === 'ack') this.acknowledgementDocument = file;
    }
  }

  submitCompletion() {
    if (!this.selectedTask()) return;
    const formData = new FormData();
    if (this.proofDocument) formData.append('proofDocument', this.proofDocument);
    if (this.certificateDocument) formData.append('certificateDocument', this.certificateDocument);
    if (this.acknowledgementDocument) formData.append('acknowledgementDocument', this.acknowledgementDocument);

    this.api.post(`compliance/tasks/${this.selectedTask().id}/complete`, formData).subscribe({
      next: () => {
        this.isCompleteModalOpen.set(false);
        this.fetchAllTasks();
      },
      error: (err: any) => console.error('Failed to complete task:', err)
    });
  }
}
