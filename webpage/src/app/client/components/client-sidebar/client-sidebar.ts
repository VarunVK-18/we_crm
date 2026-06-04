import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, UserAccountIcon } from '@hugeicons/core-free-icons';
import { Api } from '../../../api';

@Component({
  selector: 'app-client-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HugeiconsIconComponent],
  templateUrl: './client-sidebar.html',
  styleUrl: './client-sidebar.css'
})
export class ClientSidebarComponent implements OnInit {
  readonly DashboardSquareRemoveIcon = DashboardSquareRemoveIcon;
  readonly UserAccountIcon = UserAccountIcon;

  user = signal<any>(null);
  clientManager = signal<any>(null);

  constructor(private router: Router, private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.user.set(parsed);
      this.fetchClientManager(parsed._id || parsed.id);
    }
  }

  fetchClientManager(uid: string) {
    if (!uid) return;
    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res: any) => {
        if (res.user && res.user.assigned_to) {
          this.clientManager.set(res.user.assigned_to);
        }
      },
      error: (err: any) => console.error('Failed to fetch client manager:', err)
    });
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
