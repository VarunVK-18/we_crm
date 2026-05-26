import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.css'
})
export class ClientDashboard implements OnInit, OnChanges {
  @Input() clientId!: string;
  @Output() goBack = new EventEmitter<void>();

  client = signal<any>(null);
  activeTab = signal<string>('overview');
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(private api: Api) {}

  ngOnInit() {
    if (this.clientId) {
      this.fetchClientDetails();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['clientId'] && !changes['clientId'].firstChange) {
      this.fetchClientDetails();
    }
  }

  fetchClientDetails() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          const found = res.clients.find((c: any) => String(c._id) === String(this.clientId));
          if (!found) {
            this.errorMessage.set('Client not found.');
          } else {
            this.client.set(found);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load client details.');
        this.isLoading.set(false);
      }
    });
  }

  getInitials(): string {
    const c = this.client();
    if (!c || !c.owner_name) return 'C';
    return c.owner_name.charAt(0).toUpperCase();
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }
}
