import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Clock01Icon, Alert01Icon, CheckmarkCircle01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-compliance',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './client-compliance.html',
  styleUrl: './client-compliance.css'
})
export class ClientCompliance implements OnInit {
  readonly Clock01Icon = Clock01Icon;
  readonly Alert01Icon = Alert01Icon;
  readonly CheckmarkCircle01Icon = CheckmarkCircle01Icon;
  readonly ArrowUpRight01Icon = ArrowUpRight01Icon;

  reminders = signal<any[]>([]);
  isLoading = signal(true);
  user = signal<any>(null);

  // Computed Values
  pendingReminders = computed(() => this.reminders().filter(r => r.status !== 'expired'));
  
  healthScore = computed(() => {
    const total = this.reminders().length;
    if (total === 0) return 1.0;
    const expired = this.reminders().filter(r => r.status === 'expired').length;
    return (total - expired) / total;
  });

  healthStatus = computed(() => {
    const score = this.healthScore();
    if (score >= 0.8) return 'EXCELLENT';
    if (score >= 0.5) return 'WARNING';
    return 'CRITICAL';
  });

  healthMessage = computed(() => {
    return this.healthScore() >= 0.8 
      ? 'Your entity compliance health is safe.' 
      : 'Action required: resolve expired/urgent items.';
  });

  urgentReminder = computed(() => {
    const pending = this.pendingReminders();
    if (pending.length === 0) return null;
    return pending.reduce((prev, curr) => (prev.daysLeft < curr.daysLeft ? prev : curr));
  });

  timelineItems = computed(() => {
    const pending = this.pendingReminders();
    if (pending.length === 0) return [{ title: 'No pending tasks', status: 'All clear', type: 'Compliance' }];
    return pending.map(r => ({
      title: r.serviceName,
      status: r.message,
      type: r.status === 'urgent' ? 'Urgent' : 'Upcoming'
    }));
  });

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
      this.fetchReminders();
    }
  }

  fetchReminders() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;
    
    this.api.get<any>(`compliance/user/${uid}`).subscribe({
      next: (res) => {
        // Map backend reminders to model format
        const fetched = res.reminders || [];
        const mapped = fetched.map((r: any) => {
           let status = 'expiringSoon';
           let message = `Ends in ${r.daysLeft} days`;
           if (r.daysLeft <= 0) {
              status = 'expired';
              message = 'Service Expired';
           } else if (r.daysLeft <= 7) {
              status = 'urgent';
              message = `Ends in ${r.daysLeft} day${r.daysLeft > 1 ? 's' : ''}`;
           }
           
           return {
             id: r._id,
             serviceName: r.serviceName,
             entityName: r.entityName,
             daysLeft: r.daysLeft,
             status,
             message
           };
        });
        this.reminders.set(mapped);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch compliance reminders:', err);
        this.isLoading.set(false);
      }
    });
  }
}
