import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, UserAccountIcon, File01Icon, EyeIcon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../components/we-loader/we-loader';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent, WeLoaderComponent],
  templateUrl: './client-profile.html',
  styleUrl: './client-profile.css',
})
export class ClientProfile implements OnInit {
  readonly DashboardSquareRemoveIcon = DashboardSquareRemoveIcon;
  readonly UserAccountIcon = UserAccountIcon;
  readonly File01Icon = File01Icon;
  readonly EyeIcon = EyeIcon;

  user = signal<any>(null);
  clientManager = signal<any>(null);
  isLoading = signal(true);
  
  constructor(private router: Router, public api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.role !== 'customer') {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // We start with the local user data to render quickly
    this.user.set(parsedUser);
    this.fetchFullProfile(parsedUser._id || parsedUser.id);
  }

  fetchFullProfile(id: string) {
    this.isLoading.set(true);
    this.api.get<any>(`users/profile/${id}`).subscribe({
      next: (res: any) => {
        if (res.user) {
          this.user.set(res.user);
          if (res.user.assigned_to) {
            this.clientManager.set(res.user.assigned_to);
          }
          // Update local storage to keep data fresh
          localStorage.setItem('user', JSON.stringify(res.user));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch client profile:', err);
        this.isLoading.set(false);
      }
    });
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    this.router.navigate(['/client-dashboard']);
  }
}
