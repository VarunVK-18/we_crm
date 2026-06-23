import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, UserAccountIcon, File01Icon, EyeIcon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../components/we-loader/we-loader';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent],
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
  allDocuments = signal<any[]>([]);
  directors = signal<any[]>([]);
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
          let docs: any[] = [];
          if (res.user.onboarding_documents) {
            docs = [...res.user.onboarding_documents];
          }
          let directorsList: any[] = [];
          
          this.api.get<any>('my-checklists').subscribe({
            next: (chkRes) => {
              if (chkRes.checklists) {
                for (const c of chkRes.checklists) {
                  if (c.requested_documents) {
                    for (const d of c.requested_documents) {
                      if (d.isUploaded && d.fileUrl) {
                        docs.push({
                          _id: d._id || Math.random().toString(),
                          name: `${c.service_name} - ${d.name}`,
                          fileUrl: d.fileUrl,
                          uploadedAt: d.uploadedAt
                        });
                      }
                    }
                  }
                  if (c.final_documents) {
                    for (const f of c.final_documents) {
                      if (f.document_id) {
                        const docId = f.document_id._id || f.document_id;
                        docs.push({
                          _id: f._id || Math.random().toString(),
                          name: `${c.service_name} - ${f.name} (Final)`,
                          fileUrl: `api/documents/${docId}`,
                          uploadedAt: f.uploadedAt
                        });
                      }
                    }
                  }
                  if (c.details && c.details.directors && Array.isArray(c.details.directors)) {
                    for (const d of c.details.directors) {
                      // Prevent duplicates by checking PAN or DIN
                      if (!directorsList.some(existing => (existing.pan === d.pan && d.pan) || (existing.din === d.din && d.din) || existing.fullName === d.fullName)) {
                        directorsList.push({
                          ...d,
                          serviceName: c.service_name
                        });
                      }
                    }
                  }
                }
              }
              this.allDocuments.set(docs);
              this.directors.set(directorsList);
              this.isLoading.set(false);
            },
            error: (err) => {
              console.error('Failed to fetch checklists for docs:', err);
              this.allDocuments.set(docs);
              this.isLoading.set(false);
            }
          });
        } else {
          this.isLoading.set(false);
        }
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

  isEditing = signal(false);
  isSaving = signal(false);
  editData: any = {};

  toggleEdit() {
    if (!this.isEditing()) {
      // Enter edit mode, copy user data
      const current = this.user();
      this.editData = {
        company_name: current?.company_name || '',
        owner_name: current?.owner_name || '',
        email: current?.email || '',
        phone: current?.phone || '',
        business_type: current?.business_type || '',
        address: current?.address || ''
      };
      this.isEditing.set(true);
    } else {
      // Cancel edit mode
      this.isEditing.set(false);
    }
  }

  saveProfile() {
    const userId = this.user()?._id || this.user()?.id;
    if (!userId) return;

    this.isSaving.set(true);
    this.api.patch<any>(`users/profile/${userId}`, this.editData).subscribe({
      next: (res) => {
        if (res.success && res.user) {
          this.user.set(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.isEditing.set(false);
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Failed to save profile:', err);
        this.isSaving.set(false);
      }
    });
  }
}
