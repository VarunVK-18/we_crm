import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Clock02Icon, Alert01Icon, CheckmarkCircle01Icon, ArrowUpRight01Icon, ArrowLeftRightIcon, AiSecurity01Icon, FilterIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-compliance',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './client-compliance.html',
  styleUrl: './client-compliance.css'
})
export class ClientCompliance implements OnInit {
  readonly Clock02Icon = Clock02Icon;
  readonly Alert01Icon = Alert01Icon;
  readonly CheckmarkCircle01Icon = CheckmarkCircle01Icon;
  readonly ArrowUpRight01Icon = ArrowUpRight01Icon;
  readonly ArrowLeftRightIcon = ArrowLeftRightIcon;
  readonly AiSecurity01Icon = AiSecurity01Icon;
  readonly FilterIcon = FilterIcon;

  reminders = signal<any[]>([]);
  checklists = signal<any[]>([]);
  isLoading = signal(true);
  user = signal<any>(null);
  isPendingModalOpen = signal(false);
  isEntityModalOpen = signal(false);
  currentEntity = signal<string>('All Entities');
  taskFilter = signal<'pending' | 'completed' | 'all'>('pending');

  // Computed Values
  availableEntities = computed(() => {
    const unique = new Set<string>();
    
    this.reminders().forEach(r => {
      if (r.entityName) unique.add(r.entityName.trim());
    });

    this.checklists().forEach(c => {
      const entityName = c.details?.entityName || c.client_id?.company_name;
      if (entityName) unique.add(entityName.trim());
    });

    return Array.from(unique).sort();
  });

  filteredTasks = computed(() => {
    const entity = this.currentEntity();
    if (entity === 'All Entities') return this.reminders();
    return this.reminders().filter(r => r.entityName && r.entityName.trim() === entity);
  });

  pendingTasks = computed(() => this.filteredTasks().filter(r => r.status !== 'Completed'));
  
  modalTasks = computed(() => {
    const filter = this.taskFilter();
    const tasks = this.filteredTasks();
    if (filter === 'pending') return tasks.filter(r => r.status !== 'Completed');
    if (filter === 'completed') return tasks.filter(r => r.status === 'Completed');
    return tasks;
  });

  groupedModalTasks = computed(() => {
    const tasks = this.modalTasks();
    const entity = this.currentEntity();
    const map = new Map<string, any[]>();
    
    tasks.forEach(r => {
      const key = entity === 'All Entities' ? (r.entityName || 'Other') : r.status;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  });
  healthScore = computed(() => {
    const pending = this.pendingTasks();
    if (pending.length === 0) return 1.0;
    
    // 100% = No pending compliances
    // 90% = Upcoming compliances only
    // 75% = Due Soon compliances
    // 50% = Critical compliances
    // 0-25% = Overdue compliances
    let minScore = 0.9;
    for (const t of pending) {
      if (t.status === 'Overdue') minScore = Math.min(minScore, 0.25);
      else if (t.status === 'Critical') minScore = Math.min(minScore, 0.5);
      else if (t.status === 'Due Soon') minScore = Math.min(minScore, 0.75);
    }
    return minScore;
  });

  healthStatus = computed(() => {
    const score = this.healthScore();
    if (score >= 0.9) return 'EXCELLENT';
    if (score >= 0.75) return 'GOOD';
    if (score >= 0.5) return 'WARNING';
    return 'CRITICAL';
  });

  healthMessage = computed(() => {
    const score = this.healthScore();
    if (score >= 0.9) return 'Your compliance health is safe.';
    if (score >= 0.75) return 'Some items are due soon.';
    if (score >= 0.5) return 'Critical action required soon.';
    return 'Action required: resolve overdue items.';
  });

  urgentReminder = computed(() => {
    const pending = this.pendingTasks();
    if (pending.length === 0) return null;
    return pending.reduce((prev, curr) => (prev.daysLeft < curr.daysLeft ? prev : curr));
  });

  timelineItems = computed(() => {
    const pending = this.pendingTasks();
    if (pending.length === 0) return [{ title: 'No pending tasks', status: 'All clear', type: 'Up To Date', daysLeft: 0 }];
    
    return pending.map(r => ({
      ...r,
      title: r.title,
      status: r.daysLeft <= 0 ? 'Overdue - Penalty Applicable' : `${r.daysLeft} Days Remaining`,
      type: r.status // Upcoming, Due Soon, Critical, Overdue
    }));
  });

  constructor(private api: Api, private router: Router) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
      this.fetchReminders();
      this.fetchChecklists();
    }
  }

  fetchChecklists() {
    this.api.get<any>('my-checklists').subscribe({
      next: (res) => {
        this.checklists.set(res.checklists || []);
      },
      error: (err) => console.error('Failed to fetch checklists for entities:', err)
    });
  }

  fetchReminders() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    
    this.api.get<any>(`compliance/tasks/user/${uid}`).subscribe({
      next: (res) => {
        const fetched = res.tasks || [];
        const mapped = fetched.map((r: any) => ({
             ...r,
             id: r._id,
             entityName: r.entityName || (r.companyId ? r.companyId.company_name : 'Individual'),
             message: r.daysLeft <= 0 ? 'Overdue - Penalty Applicable' : `Due in ${r.daysLeft} days`
        }));
        this.reminders.set(mapped);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch compliance tasks:', err);
        this.isLoading.set(false);
      }
    });
  }

  // File Upload State for Complete Task
  selectedTask = signal<any>(null);
  isCompleteModalOpen = signal(false);
  proofDocument: File | null = null;
  certificateDocument: File | null = null;
  acknowledgementDocument: File | null = null;

  openCompleteModal(task: any) {
    this.selectedTask.set(task);
    this.proofDocument = null;
    this.certificateDocument = null;
    this.acknowledgementDocument = null;
    this.isPendingModalOpen.set(false);
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
        this.fetchReminders();
      },
      error: (err) => console.error('Failed to complete task:', err)
    });
  }

  renewService(serviceName: string) {
    // Navigate to the services catalog, where client-services component will
    // automatically find the correct category and auto-select the service.
    this.isPendingModalOpen.set(false);
    this.router.navigate(['/client/services'], {
      queryParams: { serviceName: serviceName }
    });
  }

  switchEntity(entity: string) {
    this.currentEntity.set(entity);
    this.isEntityModalOpen.set(false);
  }
}
