import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../api';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css'
})
export class AuditLogs implements OnInit {
  logs = signal<any[]>([]);

  constructor(private api: Api) {}

  ngOnInit() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.api.get<any>('audit-logs').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.logs.set(res.logs);
        }
      },
      error: (err) => {
        console.error('Failed to fetch audit logs:', err);
      }
    });
  }
}
