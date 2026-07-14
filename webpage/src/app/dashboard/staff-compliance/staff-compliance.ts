import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Alert01Icon, CheckmarkCircle01Icon, Calendar02Icon, Search01Icon, ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-staff-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent],
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
  clientIdFilter = signal<string>('');
  entityFilter = signal<string>('');
  taskFilter = signal<string>('');
  statusFilter = signal<string>('');
  
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
    
    const clientQ = this.clientIdFilter().toLowerCase();
    const entityQ = this.entityFilter().toLowerCase();
    const taskQ = this.taskFilter().toLowerCase();
    const statusQ = this.statusFilter().toLowerCase();
    
    return all.filter(t => {
      const clientIdMatch = t.clientUid?.custom_client_id?.toLowerCase().includes(clientQ) || t.clientUid?.owner_name?.toLowerCase().includes(clientQ) || t.clientUid?.company_name?.toLowerCase().includes(clientQ) || ''.includes(clientQ);
      const entityMatch = t.entityName?.toLowerCase().includes(entityQ);
      const taskMatch = t.title?.toLowerCase().includes(taskQ);
      const statusMatch = t.status?.toLowerCase().includes(statusQ) || t.message?.toLowerCase().includes(statusQ);
      
      return (!clientQ || clientIdMatch) &&
             (!entityQ || entityMatch) &&
             (!taskQ || taskMatch) &&
             (!statusQ || statusMatch);
    });
  });

  paginatedTasks = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredTasks().slice(start, start + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filteredTasks().length / this.pageSize()) || 1);

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  hasActiveFilters = computed(() => {
    return this.clientIdFilter() || this.entityFilter() || this.taskFilter() || this.statusFilter();
  });

  constructor(private api: Api, private router: Router) {}

  ngOnInit() {
    this.fetchAllTasks();
  }

  viewDetails(id: string) {
    this.router.navigate(['/dashboard/compliance-details', id]);
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
