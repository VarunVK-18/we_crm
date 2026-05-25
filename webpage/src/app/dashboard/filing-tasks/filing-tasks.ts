import { Component, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  Search01Icon, 
  PlusSignIcon, 
  Cancel01Icon 
} from '@hugeicons/core-free-icons';
import { Api } from '../../api';

@Component({
  selector: 'app-filing-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './filing-tasks.html',
  styleUrl: './filing-tasks.css'
})
export class FilingTasks implements OnInit {
  user = signal<any>(null);
  tasks = signal<any[]>([]);
  teams = input<any[]>([]);
  clients = signal<any[]>([]);

  // Icon assets
  readonly Search01Icon = Search01Icon;
  readonly PlusSignIcon = PlusSignIcon;
  readonly Cancel01Icon = Cancel01Icon;

  // Filing Task Search & Filters
  taskSearchQuery = signal<string>('');
  taskStatusFilter = signal<string>('All');

  // Task Detail Modal State
  selectedDetailTask = signal<any>(null);
  isDetailModalOpen = signal<boolean>(false);
  detailActiveTab = signal<'docs' | 'comments'>('docs');
  detailCommentText = '';
  detailDocName = '';
  detailDocFile: File | null = null;

  // Create Task Modal State
  isCreateTaskModalOpen = signal<boolean>(false);
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskClientId = '';
  newTaskAssignedTo = '';
  taskErrorMessage = signal<string>('');
  taskSuccessMessage = signal<string>('');

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchTasks();
    this.fetchClients();
  }

  getCompanyId(): string | null {
    const u = this.user();
    if (!u) return null;
    if (u.company_id && typeof u.company_id === 'object') {
      return u.company_id._id || null;
    }
    return u.company_id || null;
  }

  canManage(): boolean {
    const role = this.user()?.role;
    return role === 'admin' || role === 'client_manager' || role === 'account_manager';
  }

  isFillingStaff(): boolean { 
    return this.user()?.role === 'filling_staff'; 
  }

  isAccountManager(): boolean { 
    return this.user()?.role === 'account_manager'; 
  }

  getInitials(name?: string): string {
    const nameStr = name || 'User';
    return nameStr.charAt(0).toUpperCase();
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'HR Specialist',
      client_manager: 'Client Manager',
      filling_staff: 'Filing Staff',
      account_manager: 'Account Manager'
    };
    return labels[role] || role;
  }

  fetchTasks() {
    this.api.get<any>('tasks').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.tasks.set(res.tasks);
        }
      },
      error: (err) => {
        console.error('Failed to fetch tasks:', err);
      }
    });
  }


  fetchClients() {
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          this.clients.set(res.clients);
        }
      }
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

  getFilteredTasks(): any[] {
    const query = this.taskSearchQuery().toLowerCase().trim();
    const filter = this.taskStatusFilter();
    let list = this.tasks();

    if (query) {
      list = list.filter(t => 
        (t.title || '').toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query) ||
        (t.client_id?.owner_name || '').toLowerCase().includes(query) ||
        (t.client_id?.company_name || '').toLowerCase().includes(query)
      );
    }

    if (filter !== 'All') {
      if (filter === 'To Do') {
        list = list.filter(t => t.status === 'Not Started' || t.status === 'Pending');
      } else if (filter === 'In Progress') {
        list = list.filter(t => t.status === 'In Progress');
      } else if (filter === 'Pending Documents') {
        list = list.filter(t => t.status === 'Pending Documents');
      } else if (filter === 'Under Review') {
        list = list.filter(t => t.status === 'Under Review' || t.status === 'Query Raised');
      } else if (filter === 'Approved') {
        list = list.filter(t => t.status === 'Approved' || t.status === 'Completed');
      } else if (filter === 'Rejected') {
        list = list.filter(t => t.status === 'Rejected');
      }
    }

    return list;
  }

  openTaskDetailModal(task: any) {
    this.selectedDetailTask.set(task);
    this.detailActiveTab.set('docs');
    this.detailCommentText = '';
    this.detailDocName = '';
    this.detailDocFile = null;
    this.isDetailModalOpen.set(true);
  }

  closeTaskDetailModal() {
    this.selectedDetailTask.set(null);
    this.isDetailModalOpen.set(false);
  }

  onDetailDocFileSelected(event: any) {
    this.detailDocFile = event.target.files?.[0] || null;
  }

  updateDetailTaskStatus(newStatus: string) {
    const task = this.selectedDetailTask();
    if (!task) return;
    this.api.patch<any>(`tasks/${task._id}`, { status: newStatus }).subscribe({
      next: (res) => {
        this.api.get<any>('tasks').subscribe({
          next: (r) => {
            if (r && r.success) {
              this.tasks.set(r.tasks);
              const updatedTask = r.tasks.find((t: any) => t._id === task._id);
              if (updatedTask) {
                this.selectedDetailTask.set(updatedTask);
              }
            }
          }
        });
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update task status.');
      }
    });
  }

  assignDetailTaskToStaff(staffId: string) {
    const task = this.selectedDetailTask();
    if (!task) return;
    this.api.patch<any>(`tasks/${task._id}`, { assigned_to: staffId || null }).subscribe({
      next: (res) => {
        this.api.get<any>('tasks').subscribe({
          next: (r) => {
            if (r && r.success) {
              this.tasks.set(r.tasks);
              const updatedTask = r.tasks.find((t: any) => t._id === task._id);
              if (updatedTask) {
                this.selectedDetailTask.set(updatedTask);
              }
              alert('Task assigned successfully!');
            }
          }
        });
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to assign task.');
      }
    });
  }

  submitDetailComment() {
    const task = this.selectedDetailTask();
    if (!task || !this.detailCommentText.trim()) return;
    this.api.post<any>(`tasks/${task._id}/comments`, { comment: this.detailCommentText }).subscribe({
      next: (res) => {
        this.detailCommentText = '';
        this.api.get<any>('tasks').subscribe({
          next: (r) => {
            if (r && r.success) {
              this.tasks.set(r.tasks);
              const updatedTask = r.tasks.find((t: any) => t._id === task._id);
              if (updatedTask) {
                this.selectedDetailTask.set(updatedTask);
              }
            }
          }
        });
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add comment.');
      }
    });
  }

  submitDetailUploadDoc() {
    const task = this.selectedDetailTask();
    if (!task) return;
    if (!this.detailDocName.trim() || !this.detailDocFile) {
      alert('Document name and file are required.');
      return;
    }
    const formData = new FormData();
    formData.append('document_name', this.detailDocName);
    formData.append('file', this.detailDocFile);

    this.api.post<any>(`tasks/${task._id}/documents`, formData).subscribe({
      next: (res) => {
        this.detailDocName = '';
        this.detailDocFile = null;
        this.api.get<any>('tasks').subscribe({
          next: (r) => {
            if (r && r.success) {
              this.tasks.set(r.tasks);
              const updatedTask = r.tasks.find((t: any) => t._id === task._id);
              if (updatedTask) {
                this.selectedDetailTask.set(updatedTask);
              }
              alert('Document uploaded successfully!');
            }
          }
        });
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to upload document.');
      }
    });
  }

  openCreateTaskModal() {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskClientId = '';
    this.newTaskAssignedTo = '';
    this.taskErrorMessage.set('');
    this.taskSuccessMessage.set('');
    this.isCreateTaskModalOpen.set(true);
  }

  submitCreateTask() {
    this.taskErrorMessage.set('');
    this.taskSuccessMessage.set('');
    if (!this.newTaskClientId || !this.newTaskTitle) {
      this.taskErrorMessage.set('Client and Task Title are required.');
      return;
    }
    const payload = {
      client_id: this.newTaskClientId,
      assigned_to: this.newTaskAssignedTo || null,
      title: this.newTaskTitle,
      description: this.newTaskDescription
    };
    this.api.post<any>('tasks', payload).subscribe({
      next: (res) => {
        this.taskSuccessMessage.set('Task created successfully!');
        this.fetchTasks();
        setTimeout(() => {
          this.isCreateTaskModalOpen.set(false);
        }, 1200);
      },
      error: (err) => {
        this.taskErrorMessage.set(err.error?.message || 'Failed to create task.');
      }
    });
  }
}
