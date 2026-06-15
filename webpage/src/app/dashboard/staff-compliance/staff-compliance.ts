import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  searchQuery = signal<string>('');
  expandedEntities = signal<Set<string>>(new Set());
  
  // File Upload State for Complete Task
  selectedTask = signal<any>(null);
  isCompleteModalOpen = signal(false);
  proofDocument: File | null = null;
  certificateDocument: File | null = null;
  acknowledgementDocument: File | null = null;

  groupedTasks = computed(() => {
    const all = this.tasks();
    const query = this.searchQuery().toLowerCase();
    const map = new Map<string, any[]>();
    
    all.forEach(r => {
      const key = r.entityName || 'Other';
      if (query && !key.toLowerCase().includes(query)) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  });

  toggleEntity(key: string) {
    const current = new Set(this.expandedEntities());
    if (current.has(key)) current.delete(key);
    else current.add(key);
    this.expandedEntities.set(current);
  }

  constructor(private api: Api) {}

  ngOnInit() {
    this.fetchAllTasks();
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
