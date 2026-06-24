import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, UserAccountIcon, File01Icon, EyeIcon, Download04Icon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../components/we-loader/we-loader';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent],
  templateUrl: './client-profile.html',
  styleUrl: './client-profile.css',
})
export class ClientProfile implements OnInit, OnDestroy {
  readonly DashboardSquareRemoveIcon = DashboardSquareRemoveIcon;
  readonly UserAccountIcon = UserAccountIcon;
  readonly File01Icon = File01Icon;
  readonly EyeIcon = EyeIcon;
  readonly Download04Icon = Download04Icon;

  user = signal<any>(null);
  clientManager = signal<any>(null);
  allDocuments = signal<any[]>([]);
  directors = signal<any[]>([]);
  isLoading = signal(true);
  selectedDirectorIndex = signal<number>(0);

  // Entity filter — synced with topbar switcher
  selectedEntity = signal<string>(localStorage.getItem('client_selected_entity') || 'All');
  private entityChangeHandler = (e: Event) => {
    this.selectedEntity.set((e as CustomEvent).detail as string);
  };

  // Stores which entity each document belongs to (by doc._id)
  private docEntityMap = new Map<string, string>();
  // Stores which entity each director entry belongs to
  private directorEntityMap = new Map<number, string>();

  /** Documents filtered by the selected entity */
  filteredDocuments = computed(() => {
    const sel = this.selectedEntity();
    if (sel === 'All') return this.allDocuments();
    return this.allDocuments().filter(doc => {
      const entityName = this.docEntityMap.get(doc._id) || '';
      return entityName.toLowerCase() === sel.toLowerCase();
    });
  });

  /** Directors filtered by the selected entity */
  filteredDirectors = computed(() => {
    const sel = this.selectedEntity();
    if (sel === 'All') return this.directors();
    return this.directors().filter(d => {
      // directors have serviceName set from the checklist; map back via directorEntityMap
      const entityName = d._entityName || '';
      return entityName.toLowerCase() === sel.toLowerCase();
    });
  });

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
                  // Resolve entity name for this checklist
                  const entityName = (
                    c.details?.entityName ||
                    c.details?.companyName ||
                    c.details?.proposed_company_name ||
                    c.details?.businessName ||
                    c.details?.entity_name ||
                    c.entityName || c.companyName || ''
                  ).trim();

                  if (c.requested_documents) {
                    for (const d of c.requested_documents) {
                      if (d.isUploaded && d.fileUrl) {
                        const docId = d._id || Math.random().toString();
                        this.docEntityMap.set(docId, entityName);
                        docs.push({
                          _id: docId,
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
                        const fId = f._id || Math.random().toString();
                        this.docEntityMap.set(fId, entityName);
                        docs.push({
                          _id: fId,
                          name: `${c.service_name} - ${f.name} (Final)`,
                          fileUrl: `api/documents/${docId}`,
                          uploadedAt: f.uploadedAt
                        });
                      }
                    }
                  }
                  if (c.details && c.details.directors && Array.isArray(c.details.directors)) {
                    for (let i = 0; i < c.details.directors.length; i++) {
                      const d = { ...c.details.directors[i] };
                      
                      // Check requested_documents for director's photo and signature if not already set
                      if (c.requested_documents) {
                        const dirIdx = i + 1;
                        const photoDoc = c.requested_documents.find((doc: any) => doc.name.toLowerCase() === `director_${dirIdx}_photo` && doc.isUploaded && doc.fileUrl);
                        if (photoDoc && !d.photo) {
                          d.photo = photoDoc.fileUrl;
                        }
                        const sigDoc = c.requested_documents.find((doc: any) => doc.name.toLowerCase() === `director_${dirIdx}_signature` && doc.isUploaded && doc.fileUrl);
                        if (sigDoc && !d.signature) {
                          d.signature = sigDoc.fileUrl;
                        }
                      }

                      // Prevent duplicates by checking PAN or DIN
                      if (!directorsList.some(existing => (existing.pan === d.pan && d.pan) || (existing.din === d.din && d.din) || existing.fullName === d.fullName)) {
                        directorsList.push({
                          ...d,
                          serviceName: c.service_name,
                          _entityName: entityName  // tag with entity for filtering
                        });
                      }
                    }
                  }
                }
              }
              
              // Merge with user.directors if any exist
              if (res.user.directors && Array.isArray(res.user.directors)) {
                for (const d of res.user.directors) {
                  const existingIndex = directorsList.findIndex(existing => (existing.pan === d.pan && d.pan) || (existing.din === d.din && d.din) || existing.fullName === d.fullName);
                  if (existingIndex >= 0) {
                    // Update existing with newer user profile data
                    directorsList[existingIndex] = { ...directorsList[existingIndex], ...d };
                  } else {
                    directorsList.push(d);
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
              this.directors.set(directorsList);
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
        address: current?.address || '',
        directors: JSON.parse(JSON.stringify(this.directors())) // Deep copy directors
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
          this.directors.set(this.editData.directors);
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

  uploadDirectorDocument(index: number, docType: 'photo' | 'signature', event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const userId = this.user()?._id || this.user()?.id;
    if (!userId) return;

    this.isSaving.set(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);

    this.api.post<any>(`users/profile/${userId}/directors/${index}/document`, formData).subscribe({
      next: (res) => {
        if (res.success && res.user) {
          this.user.set(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
          
          // Update local arrays
          const dirs = [...this.directors()];
          if (dirs[index]) {
            dirs[index][docType] = res.fileUrl;
            this.directors.set(dirs);
          }
          if (this.editData.directors && this.editData.directors[index]) {
            this.editData.directors[index][docType] = res.fileUrl;
          }
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        this.isSaving.set(false);
      }
    });
  }

  async downloadImage(url: string, filename: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  }
}
