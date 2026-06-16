import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Building04Icon, ArrowDown01Icon, ArrowUp01Icon, Copy01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-company-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './client-company-details.html',
  styleUrl: './client-company-details.css'
})
export class ClientCompanyDetails implements OnInit {
  readonly Building04Icon = Building04Icon;
  readonly ArrowDown01Icon = ArrowDown01Icon;
  readonly ArrowUp01Icon = ArrowUp01Icon;
  readonly Copy01Icon = Copy01Icon;

  user = signal<any>(null);
  isLoading = signal(true);
  
  selectedEntityIndex = signal<number>(0);

  constructor(private router: Router, public api: Api, private datePipe: DatePipe) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    
    this.user.set(parsedUser);
    // Initialize first entity selection
    if (parsedUser.client_entities && parsedUser.client_entities.length > 0) {
      this.selectedEntityIndex.set(0);
    }
    
    this.fetchFullProfile(parsedUser._id || parsedUser.id);
  }

  fetchFullProfile(id: string) {
    this.isLoading.set(true);
    this.api.get<any>(`users/profile/${id}`).subscribe({
      next: (res: any) => {
        if (res.user) {
          this.user.set(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
          
          if (res.user.client_entities && res.user.client_entities.length > 0) {
             this.selectedEntityIndex.set(0);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch client profile:', err);
        this.isLoading.set(false);
      }
    });
  }

  selectEntity(index: number) {
    this.selectedEntityIndex.set(index);
  }

  copyToClipboard(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} copied to clipboard!`);
    });
  }

  formatDate(dateStr: string) {
    if (!dateStr) return '';
    return this.datePipe.transform(dateStr, 'dd MMM yyyy') || dateStr;
  }
}
