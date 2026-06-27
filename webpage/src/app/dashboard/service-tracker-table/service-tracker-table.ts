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
    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow-x: auto;
      margin-top: 16px;
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-top: 8px;
    }
    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px;
    }
    .page-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-box input {
      padding: 10px 16px 10px 40px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      width: 300px;
      transition: all 0.2s;
      outline: none;
    }
    .search-box input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .search-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      font-size: 20px;
    }
    .total-badge {
      background: #eff6ff;
      color: #2563eb;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
    }
    .we-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .we-table th {
      padding: 16px 20px;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .we-table td {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      font-size: 14px;
      vertical-align: middle;
    }
    .we-table tr:hover {
      background: #f8fafc;
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

  constructor(private api: Api) {}

  ngOnInit() {
    this.fetchChecklists();
  }

  fetchChecklists() {
    this.isLoading.set(true);
    this.api.get<any>('checklists').subscribe({
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
    const query = this.searchQuery().toLowerCase();
    const lists = this.checklists();
    
    if (!query) return lists;
    
    return lists.filter(c => {
      const clientName = (c.client_id?.company_name || c.client_id?.owner_name || '').toLowerCase();
      const serviceName = (c.service_name || c.checklist_name || '').toLowerCase();
      const cid = (c.client_id?._id || '').toLowerCase();
      const sid = (c._id || '').toLowerCase();
      
      return clientName.includes(query) || serviceName.includes(query) || cid.includes(query) || sid.includes(query);
    });
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
}
