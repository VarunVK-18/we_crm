import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css'
})
export class AuditLogs implements OnInit {
  logs = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  fromDate = signal<string>('');
  toDate = signal<string>('');

  constructor(private api: Api) {}

  ngOnInit() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.api.get<any>('audit-logs').subscribe({
      next: (res) => {
        if (res && res.success) {
          const transformedLogs = res.logs.map((log: any) => {
            if (log.action) {
              log.action = log.action.replace(/bucket/gi, 'Service');
            }
            if (log.details) {
              log.details = log.details.replace(/bucket/gi, 'Service');
            }
            return log;
          });
          this.logs.set(transformedLogs);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch audit logs:', err);
        this.isLoading.set(false);
      }
    });
  }

  filteredLogs() {
    const query = this.searchQuery().toLowerCase().trim();
    const from = this.fromDate() ? new Date(this.fromDate()).getTime() : null;
    const to = this.toDate() ? new Date(this.toDate()).getTime() + 86400000 : null; // Add 1 day for inclusive end date
    
    return this.logs().filter(log => {
      // Date Filter
      const logTime = new Date(log.createdAt).getTime();
      if (from && logTime < from) return false;
      if (to && logTime >= to) return false;
      
      // Search Query Filter
      if (query) {
        const action = (log.action || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const performedBy = (log.performed_by?.owner_name || '').toLowerCase();
        const role = (log.performed_by?.role || '').toLowerCase();
        
        if (!action.includes(query) && !details.includes(query) && !performedBy.includes(query) && !role.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }
}
