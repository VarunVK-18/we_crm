import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Alert01Icon, CheckmarkCircle01Icon, Calendar02Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-staff-compliance',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './staff-compliance.html',
  styleUrl: './staff-compliance.css'
})
export class StaffCompliance implements OnInit {
  readonly Alert01Icon = Alert01Icon;
  readonly CheckmarkCircle01Icon = CheckmarkCircle01Icon;
  readonly Calendar02Icon = Calendar02Icon;

  tasks = signal<any[]>([]);
  isLoading = signal(true);
  
  // File Upload State for Complete Task
  selectedTask = signal<any>(null);
  isCompleteModalOpen = signal(false);
  proofDocument: File | null = null;
  certificateDocument: File | null = null;
  acknowledgementDocument: File | null = null;

  groupedTasks = computed(() => {
    const all = this.tasks();
    const map = new Map<string, any[]>();
    
    all.forEach(r => {
      const key = r.entityName || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  });

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
