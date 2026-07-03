import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

interface TeamMember {
  _id: string;
  owner_name: string;
  email: string;
  role: string;
  profile_image?: string;
  ongoingCount: number;
  completedCount: number;
}

interface TeamStats {
  _id: string;
  name: string;
  manager_id: { _id: string; owner_name: string; email: string };
  members: TeamMember[];
  totalOngoing: number;
  totalCompleted: number;
}

@Component({
  selector: 'app-team-service-track',
  standalone: true,
  imports: [CommonModule, FormsModule, WeLoaderComponent],
  templateUrl: './team-service-track.html',
  styleUrls: ['./team-service-track.css']
})
export class TeamServiceTrackComponent implements OnInit {
  private api = inject(Api);

  allTeams = signal<TeamStats[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  selectedDate = signal<string>('');
  selectedManagerId = signal<string>('all');

  availableManagers = signal<{_id: string, name: string}[]>([]);

  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  years: number[] = [];

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      this.years.push(i);
    }
    this.fetchStats();
  }

  fetchStats() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const queryParams = new URLSearchParams();
    if (this.selectedDate()) {
      queryParams.append('exactDate', this.selectedDate());
    } else {
      queryParams.append('month', this.selectedMonth().toString());
      queryParams.append('year', this.selectedYear().toString());
    }
    const url = `teams/service-stats?${queryParams.toString()}`;
    
    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success) {
          const teams = res.teams || [];
          this.allTeams.set(teams);
          
          // Extract unique managers
          const managersMap = new Map<string, { _id: string, name: string }>();
          teams.forEach((t: TeamStats) => {
            if (t.manager_id && t.manager_id._id) {
              managersMap.set(t.manager_id._id, { _id: t.manager_id._id, name: t.manager_id.owner_name });
            }
          });
          this.availableManagers.set(Array.from(managersMap.values()));
          
          // Reset manager selection if it's no longer valid
          if (this.selectedManagerId() !== 'all' && !managersMap.has(this.selectedManagerId())) {
             this.selectedManagerId.set('all');
          }
        } else {
          this.errorMessage.set(res.message || 'Failed to load stats');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Server error while loading team stats.');
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange() {
    this.fetchStats();
  }

  filteredTeams() {
    const managerId = this.selectedManagerId();
    if (managerId === 'all') {
      return this.allTeams();
    }
    return this.allTeams().filter(t => t.manager_id && t.manager_id._id === managerId);
  }
}
