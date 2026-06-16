import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  CrownIcon,
  Download01Icon,
  FileAttachmentIcon,
  CheckmarkBadge01Icon
} from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-client-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule, HugeiconsIconComponent, DatePipe, WeLoaderComponent],
  templateUrl: './client-subscriptions.html',
  styleUrl: './client-subscriptions.css'
})
export class ClientSubscriptions implements OnInit {
  user = signal<any>(null);
  completedServices = signal<any[]>([]);
  isLoading = signal(true);

  // Icons
  CrownIcon = CrownIcon;
  Download01Icon = Download01Icon;
  FileAttachmentIcon = FileAttachmentIcon;
  CheckmarkBadge01Icon = CheckmarkBadge01Icon;

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
      this.fetchCompletedServices();
    } else {
      this.isLoading.set(false);
    }
  }

  fetchCompletedServices() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;

    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        const completed: any[] = [];
        
        for (const c of checklists) {
          if (c.status === 'completed') {
            completed.push(c);
          }
        }
        
        this.completedServices.set(completed);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching completed services', err);
        this.isLoading.set(false);
      }
    });
  }
}
