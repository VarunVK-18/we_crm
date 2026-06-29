import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../api';
import { Building04Icon, ArrowDown01Icon, ArrowUp01Icon, Copy01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-company-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './client-company-details.html',
  styleUrl: './client-company-details.css'
})
export class ClientCompanyDetails implements OnInit, OnDestroy {
  readonly Building04Icon = Building04Icon;
  readonly ArrowDown01Icon = ArrowDown01Icon;
  readonly ArrowUp01Icon = ArrowUp01Icon;
  readonly Copy01Icon = Copy01Icon;

  user = signal<any>(null);
  isLoading = signal(true);
  
  copiedState = signal<Record<string, boolean>>({});
  
  selectedEntityIndex = signal<number>(0);

  // Global entity filter synced with topbar switcher
  selectedEntity = signal<string>(localStorage.getItem('client_selected_entity') || 'All');
  private entityChangeHandler = (e: Event) => {
    this.selectedEntity.set((e as CustomEvent).detail as string);
    this.selectedEntityIndex.set(0); // Reset index when global filter changes
  };

  filteredEntities = computed(() => {
    if (!this.user()?.client_entities) return [];
    const sel = this.selectedEntity();
    if (sel === 'All') return this.user().client_entities;
    
    return this.user().client_entities.filter((e: any) => 
      e.entityName && e.entityName.trim().toLowerCase() === sel.toLowerCase()
    );
  });

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
    window.addEventListener('entityChanged', this.entityChangeHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('entityChanged', this.entityChangeHandler);
  }

  fetchFullProfile(id: string) {
    this.isLoading.set(true);
    this.api.get<any>(`users/profile/${id}`).subscribe({
      next: (res: any) => {
        if (res.user) {
          // Fallback: Ensure primary company_name is in client_entities
          if (res.user.company_name && res.user.company_name.trim() !== '') {
            if (!res.user.client_entities) res.user.client_entities = [];
            const primaryName = res.user.company_name.trim();
            const exists = res.user.client_entities.some((e: any) => 
              e.entityName && e.entityName.trim().toLowerCase() === primaryName.toLowerCase()
            );
            if (!exists) {
              res.user.client_entities.unshift({
                entityName: primaryName,
                entityType: res.user.business_type || 'Company',
                pan: res.user.pan || '',
                gstin: res.user.gstin || ''
              });
            }
          }

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
      this.copiedState.update(state => ({ ...state, [label]: true }));
      setTimeout(() => {
        this.copiedState.update(state => ({ ...state, [label]: false }));
      }, 2000);
    }).catch(err => console.error('Failed to copy', err));
  }

  formatDate(dateStr: string) {
    if (!dateStr) return '';
    return this.datePipe.transform(dateStr, 'dd MMM yyyy') || dateStr;
  }
}
