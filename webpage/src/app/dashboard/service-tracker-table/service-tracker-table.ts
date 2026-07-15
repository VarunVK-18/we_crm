import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-service-tracker-table',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './service-tracker-table.html',
  styles: [`
    .bucket-table-container {
      background-color: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow-x: auto;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      margin-top: 16px;
    }
    .bucket-table {
      min-width: 100%;
      width: max-content;
      text-align: left;
      border-collapse: collapse;
      white-space: nowrap;
    }
    .bucket-table th {
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background-color: #f8fafc;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      resize: horizontal;
      overflow: auto;
      position: relative;
      min-width: 100px;
      max-width: 300px;
      width: 140px;
    }
    .bucket-table th::-webkit-scrollbar {
      height: 0px;
      width: 0px;
    }
    .bucket-table th::-webkit-resizer {
      background: transparent;
      border: none;
    }
    .bucket-table td {
      padding: 8px 16px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      max-width: 300px;
    }
    .bucket-table th:last-child,
    .bucket-table td:last-child {
      border-right: none;
    }
    .ellipsis-text {
      display: block;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }
    .col-search-input {
      width: 100%;
      min-width: 100px;
      margin-top: 6px;
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 400;
      color: #334155;
      background-color: white;
      box-sizing: border-box;
      outline: none;
    }
    .col-search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    .table-row-hover {
      transition: background-color 0.2s ease;
    }
    .table-row-hover:hover {
      background-color: #f8fafc;
    }
    .status-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }
    .status-completed {
      background: #d1fae5;
      color: #059669;
    }
    .status-in-progress {
      background: #dbeafe;
      color: #2563eb;
    }
    .status-pending {
      background: #fef3c7;
      color: #d97706;
    }
    .status-default {
      background: #f1f5f9;
      color: #475569;
    }
  `]
})
export class ServiceTrackerTableComponent implements OnInit {
  checklists = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');

  colSearch_serviceId = signal<string>('');
  colSearch_clientId = signal<string>('');
  colSearch_companyName = signal<string>('');
  colSearch_serviceName = signal<string>('');
  colSearch_task = signal<string>('');
  colSearch_updatedOn = signal<string>('');
  colSearch_assignedTo = signal<string>('');

  constructor(private api: Api) {}

  ngOnInit() {
    this.fetchChecklists();
  }

  fetchChecklists() {
    this.isLoading.set(true);
    this.api.get<any>('checklists/summary').subscribe({
      next: (res) => {
        if (res.checklists) {
          const activeChecklists = res.checklists.filter((c: any) => c.status !== 'completed' && c.status !== 'rejected');
          this.checklists.set(activeChecklists);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching checklists for table', err);
        this.isLoading.set(false);
      }
    });
  }

  filteredChecklists() {
    let lists = this.checklists();
    const query = this.searchQuery().toLowerCase();
    
    if (query) {
      lists = lists.filter(c => {
        const clientName = (c.client_id?.company_name || c.client_id?.owner_name || '').toLowerCase();
        const serviceName = (c.service_name || c.checklist_name || '').toLowerCase();
        const cid = (c.client_id?._id || '').toLowerCase();
        const sid = (c._id || '').toLowerCase();
        
        return clientName.includes(query) || serviceName.includes(query) || cid.includes(query) || sid.includes(query);
      });
    }

    const sId = this.colSearch_serviceId().toLowerCase();
    if (sId) lists = lists.filter(c => (c.custom_service_id || '').toLowerCase().includes(sId));

    const cId = this.colSearch_clientId().toLowerCase();
    if (cId) lists = lists.filter(c => (c.client_id?.custom_client_id || '').toLowerCase().includes(cId));

    const company = this.colSearch_companyName().toLowerCase();
    if (company) lists = lists.filter(c => (c.details?.entityName || c.details?.entity_name || c.client_id?.company_name || c.client_id?.owner_name || '').toLowerCase().includes(company));

    const service = this.colSearch_serviceName().toLowerCase();
    if (service) lists = lists.filter(c => (c.service_name || c.checklist_name || '').toLowerCase().includes(service));

    const task = this.colSearch_task().toLowerCase();
    if (task) lists = lists.filter(c => this.getNextTask(c.items).toLowerCase().includes(task));

    const updated = this.colSearch_updatedOn().toLowerCase();
    if (updated) lists = lists.filter(c => this.formatDate(c.updatedAt).toLowerCase().includes(updated));

    const assigned = this.colSearch_assignedTo().toLowerCase();
    if (assigned) lists = lists.filter(c => (c.assigned_to?.owner_name || 'unassigned').toLowerCase().includes(assigned));

    return lists;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'status-completed';
    if (s === 'in_progress' || s === 'in progress' || s === 'active') return 'status-in-progress';
    if (s === 'pending' || s === 'new') return 'status-pending';
    return 'status-default';
  }

  formatStatus(status: string): string {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getNextTask(items: any[]): string {
    if (!items || !items.length) return 'No tasks defined';
    const nextTask = items.find(i => !i.isChecked);
    if (!nextTask) return 'All tasks completed';
    return nextTask.title || nextTask.label || 'Unnamed task';
  }
}
