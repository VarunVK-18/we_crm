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
  allDocuments = signal<any[]>([]);
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
                }
              }
              this.allDocuments.set(docs);
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
}
