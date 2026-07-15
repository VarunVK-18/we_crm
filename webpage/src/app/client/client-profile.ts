import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { DashboardSquareRemoveIcon, UserAccountIcon, File01Icon, EyeIcon, Download04Icon, Upload04Icon, Loading02Icon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../components/we-loader/we-loader';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent, PdfViewerModule],
  templateUrl: './client-profile.html',
  styleUrl: './client-profile.css',
})
export class ClientProfile implements OnInit, OnDestroy {
  readonly DashboardSquareRemoveIcon = DashboardSquareRemoveIcon;
  readonly UserAccountIcon = UserAccountIcon;
  readonly File01Icon = File01Icon;
  readonly EyeIcon = EyeIcon;
  readonly Download04Icon = Download04Icon;
  readonly Upload04Icon = Upload04Icon;
  readonly Loading02Icon = Loading02Icon;

  user = signal<any>(null);
  clientManager = signal<any>(null);
  allDocuments = signal<any[]>([]);
  directors = signal<any[]>([]);
  isLoading = signal(true);
  selectedDirectorIndex = signal<number>(0);
  activeLoadingAction = signal<string | null>(null);

  // Entity filter — synced with topbar switcher
  selectedEntity = signal<string>(localStorage.getItem('client_selected_entity') || 'All');
  private entityChangeHandler = (e: Event) => {
    this.selectedEntity.set((e as CustomEvent).detail as string);
  };

  activeTab = signal('overview');

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

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

  allChecklists = signal<any[]>([]);
  completedServices = computed(() => {
    const sel = this.selectedEntity();
    const list = this.allChecklists().filter((c: any) => c.status === 'completed' || c.status === 'Completed' || c.status === 'done' || c.status === 'Done');
    if (sel === 'All') return list;
    return list.filter((c: any) => {
      const entityName = (
        c.details?.entityName || c.details?.companyName || c.details?.proposed_company_name ||
        c.details?.businessName || c.details?.entity_name || c.entityName || c.companyName || ''
      ).trim();
      return entityName.toLowerCase() === sel.toLowerCase();
    });
  });

  /** Directors filtered by the selected entity */
  filteredDirectors = computed(() => {
    const sel = this.selectedEntity();
    if (sel === 'All') return this.directors();
    
    // Always include directors that don't have a specific entity tagged, 
    // or those that match the selected entity. 
    return this.directors().filter(d => {
      const entityName = d._entityName || '';
      return entityName.toLowerCase() === sel.toLowerCase() || entityName === '';
    });
  });

  get shortCompanyName(): string {
    const full = this.user()?.company_name;
    if (!full) return '';
    return full.replace(/\b(private limited|pvt\.?\s*ltd\.?|limited|ltd\.?|llp|opc|inc|corp)\b/gi, '').trim();
  }

  get entityType(): string {
    const u = this.user();
    if (!u) return 'N/A';
    if (u.business_type && u.business_type !== 'N/A') return u.business_type;
    if (u.company_type_expanded && u.company_type_expanded !== 'N/A') return u.company_type_expanded;
    if (u.class_of_company && u.class_of_company !== 'N/A') {
      const cls = u.class_of_company.toLowerCase();
      if (cls.includes('private')) return 'Private Limited Company';
      if (cls.includes('public')) return 'Public Limited Company';
      return u.class_of_company;
    }
    
    // Derive from name if fields are empty
    const name = (u.company_name || '').toUpperCase();
    if (name.includes('PRIVATE LIMITED') || name.includes('PVT LTD') || name.includes('PVT. LTD.')) return 'Private Limited Company';
    if (name.includes('LIMITED') || name.includes('LTD')) return 'Public Limited Company';
    if (name.includes('LLP') || name.includes('LIMITED LIABILITY PARTNERSHIP')) return 'LLP (Limited Liability Partnership)';
    if (name.includes('OPC') || name.includes('ONE PERSON COMPANY')) return 'OPC (One Person Company)';
    
    return 'N/A';
  }

  constructor(private router: Router, public api: Api, private confirmDialog: ConfirmDialogService) { }
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
            docs = [...res.user.onboarding_documents.map((d: any) => ({ ...d, docType: d.name, sourceType: 'profile_document' }))];
          }
          let directorsList: any[] = [];

          this.api.get<any>('my-checklists').subscribe({
            next: (chkRes) => {
              if (chkRes.checklists) {
                this.allChecklists.set(chkRes.checklists);
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

                  // Evaluate payment status for this checklist
                  const isDealClosed = c.dealClosedAmount !== undefined && c.dealClosedAmount > 0;
                  const paidAmount = c.advanceAmountPaid || 0;
                  const isPaymentPending = isDealClosed && paidAmount < c.dealClosedAmount;

                  if (c.requested_documents) {
                    for (const d of c.requested_documents) {
                      if (d.isUploaded && d.fileUrl) {
                        const docId = d._id || Math.random().toString();
                        this.docEntityMap.set(docId, entityName);
                        docs.push({
                          _id: docId,
                          name: `${c.service_name} - ${d.name}`,
                          fileUrl: d.fileUrl,
                          uploadedAt: d.uploadedAt,
                          sourceType: 'requested_document',
                          checklistId: c._id,
                          documentId: d._id
                        });
                      }
                    }
                  }
                  if (c.final_documents) {
                    let isFinalBoxTicked = false;
                    if (c.items && c.items.length > 0) {
                      isFinalBoxTicked = !!c.items[c.items.length - 1].isChecked;
                    }
                    if (isFinalBoxTicked) {
                      for (const f of c.final_documents) {
                        if (f.document_id) {
                          const docId = f.document_id._id || f.document_id;
                          const fId = f._id || Math.random().toString();
                          this.docEntityMap.set(fId, entityName);
                          docs.push({
                            _id: fId,
                            name: `${c.service_name} - ${f.name} (Final)`,
                            fileUrl: `api/documents/${docId}`,
                            uploadedAt: f.uploadedAt,
                            sourceType: 'final_document',
                            checklistId: c._id,
                            documentId: f._id
                          });
                        }
                      }
                    }
                  }
                  let rawDirs = c.details && (c.details.directors || c.details.partners || c.details.members);
                  if (typeof rawDirs === 'string') {
                    try { rawDirs = JSON.parse(rawDirs); } catch (e) {}
                  }
                  if (Array.isArray(rawDirs)) {
                    for (let i = 0; i < rawDirs.length; i++) {
                      const d = { ...rawDirs[i] };

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

                      // Check incorpDocs if they came from the incorporation form directly
                      if (c.details && c.details.incorpDocs) {
                        const dirIdx = i + 1;
                        const photoDoc = c.details.incorpDocs.find((doc: any) => doc.name === `Person ${dirIdx} - PHOTO`);
                        if (photoDoc && !d.photo) {
                          d.photo = photoDoc.fileUrl;
                        }
                        const sigDoc = c.details.incorpDocs.find((doc: any) => doc.name === `Person ${dirIdx} - SIGNATURE`);
                        if (sigDoc && !d.signature) {
                          d.signature = sigDoc.fileUrl;
                        }
                      }

                      // Prevent duplicates by checking email (better for dummy data where PANs are reused)
                      if (!directorsList.some(existing => existing.email === d.email && d.email)) {
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
                  const existingIndex = directorsList.findIndex(existing => (existing.pan === d.pan && d.pan) || (existing.din === d.din && d.din) || ((existing.firstName === d.firstName && existing.lastName === d.lastName) && d.firstName));
                  if (existingIndex >= 0) {
                    // Update existing with newer user profile data
                    const merged = { ...directorsList[existingIndex], ...d };
                    if (!d.photo && directorsList[existingIndex].photo) merged.photo = directorsList[existingIndex].photo;
                    if (!d.signature && directorsList[existingIndex].signature) merged.signature = directorsList[existingIndex].signature;
                    directorsList[existingIndex] = merged;
                  } else {
                    directorsList.push(d);
                  }
                }
              }

              this.allDocuments.set(docs);
              console.log('Final directorsList:', directorsList);
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

  async logout() {
    const choice = await this.confirmDialog.confirm({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      isDestructive: true
    });

    if (choice) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('client_selected_entity');
      this.router.navigate(['/login']);
    }
  }

  goToDashboard() {
    this.router.navigate(['/client-dashboard']);
  }

  isDocViewerOpen = signal(false);
  isDocViewerLoading = signal(false);
  docViewerSrc = '';
  docViewerName = '';
  docViewerType = signal<'pdf' | 'image' | ''>('');

  async openDocViewer(url: string, name: string, event: Event, doc?: any) {
    event.preventDefault();
    
    if (doc && doc.isPaymentPending) {
      const choice = await this.confirmDialog.confirm({
        title: 'Document Locked',
        message: 'Almost there! Your document is ready, but there\'s a pending balance on this service. You can securely pay online now or contact your account manager for assistance.',
        confirmText: 'Pay Online',
        cancelText: 'Call Account Manager'
      });
      
      if (choice === true) {
        window.open('/client/wallet', '_self');
      } else if (choice === false) {
        window.open('/client/support', '_self');
      }
      return;
    }

    let finalUrl = this.api.getFileUrl(url);
    this.docViewerName = name || 'Document';
    this.docViewerType.set('');
    this.isDocViewerLoading.set(true);
    this.isDocViewerOpen.set(true);

    // Detect file type via magic bytes (first 4 bytes) for guaranteed accuracy
    try {
      const res = await fetch(finalUrl, { headers: { 'Range': 'bytes=0-3' } });
      if (!res.ok) {
        alert('Document not found or no longer available.');
        this.closeDocViewer();
        return;
      }
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // PDF magic: %PDF = 0x25, 0x50, 0x44, 0x46
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        this.docViewerType.set('pdf');
      // JPEG magic: 0xFF, 0xD8, 0xFF
      } else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        this.docViewerType.set('image');
      // PNG magic: 0x89, P, N, G
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        this.docViewerType.set('image');
      // GIF magic: G, I, F
      } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        this.docViewerType.set('image');
      } else {
        // Try Content-Type from response header as fallback
        const cType = res.headers.get('content-type') || '';
        if (cType.includes('pdf')) this.docViewerType.set('pdf');
        else if (cType.includes('image')) this.docViewerType.set('image');
      }
    } catch (e) {
      // If fetch fails completely, use URL/name-based heuristics
      const lowerUrl = finalUrl.toLowerCase();
      const lowerName = (name || '').toLowerCase();
      if (lowerUrl.includes('.pdf') || lowerUrl.includes('pdf')) {
        this.docViewerType.set('pdf');
      } else if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)/) || lowerName.includes('photo') || lowerName.includes('signature') || lowerName.includes('aadhar') || lowerName.includes('pan')) {
        this.docViewerType.set('image');
      }
    }

    this.docViewerSrc = finalUrl;
    this.isDocViewerLoading.set(false);
  }

  closeDocViewer() {
    this.isDocViewerOpen.set(false);
    this.isDocViewerLoading.set(false);
    this.docViewerSrc = '';
    this.docViewerName = '';
    this.docViewerType.set('');
  }

  forceDownload(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    let docName = this.docViewerName || 'document';
    const clientName = this.user()?.owner_name || this.user()?.company_name || this.user()?.name || '';
    if (clientName && !docName.toLowerCase().includes(clientName.toLowerCase())) {
      docName = `${clientName.trim().replace(/\s+/g, '_')}_${docName}`;
    }
    
    this.api.downloadFile(this.docViewerSrc, docName);
  }

  isImage(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.png') || lowerUrl.endsWith('.webp') || lowerUrl.endsWith('.gif');
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
        pan: current?.pan || '',
        pan_name: current?.pan_name || '',
        pan_father_name: current?.pan_father_name || '',
        pan_dob: current?.pan_dob || '',
        gstin: current?.gstin || '',
        tan: current?.tan || '',
        cin: current?.cin || '',
        incorporation_date: current?.incorporation_date || '',
        company_email: current?.company_email || '',
        main_division_description: current?.main_division_description || '',
        authorised_capital: current?.authorised_capital || '',
        paidup_capital: current?.paidup_capital || '',
        total_obligation_of_contribution: current?.total_obligation_of_contribution || '',
        address_type: current?.address_type || '',
        street_address_line_1: current?.street_address_line_1 || '',
        street_address_line_2: current?.street_address_line_2 || '',
        city: current?.city || '',
        state: current?.state || '',
        postal_code: current?.postal_code || '',
        main_division_no: current?.main_division_no || '',
        company_type_expanded: current?.company_type_expanded || '',
        class_of_company: current?.class_of_company || '',
        company_category: current?.company_category || '',
        company_subcategory: current?.company_subcategory || '',
        registration_number: current?.registration_number || '',
        company_origin: current?.company_origin || '',
        roc: current?.roc || '',
        directors: JSON.parse(JSON.stringify(this.directors())).map((d: any) => {
          if (!d.firstName && !d.lastName && d.fullName) {
            const parts = d.fullName.trim().split(' ');
            d.firstName = parts[0];
            d.lastName = parts.slice(1).join(' ');
          }
          return d;
        })
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
    if (event.target) event.target.value = '';
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

  reuploadGeneralDocument(doc: any, event: any) {
    const file = event.target.files[0];
    if (event.target) event.target.value = '';
    if (!file) return;

    const u = this.user();
    if (!u || !u._id) return;

    const docType = typeof doc === 'string' ? doc : (doc.docType || doc.name || 'doc');
    const sourceType = typeof doc === 'object' ? doc.sourceType : 'profile_document';

    this.activeLoadingAction.set(`upload-${docType}`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);

    let apiUrl = `users/profile/${u._id}/documents/reupload`;
    
    if (sourceType === 'final_document' && doc.checklistId && doc.documentId) {
      apiUrl = `checklists/${doc.checklistId}/final-documents/${doc.documentId}/reupload`;
      formData.delete('file');
      formData.append('final_file', file);
    } else if (sourceType === 'incorp_document' || sourceType === 'requested_document') {
      alert('Reuploading this type of document is not yet fully supported by the backend.');
      this.activeLoadingAction.set(null);
      return;
    }

    this.api.put(apiUrl, formData).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Update the local user info
          this.fetchFullProfile(u._id);
        } else {
          alert('Failed to reupload document');
        }
      },
      error: (err) => {
        console.error('Error reuploading document:', err);
        alert('Error reuploading document');
      },
      complete: () => {
        this.activeLoadingAction.set(null);
        event.target.value = '';
      }
    });
  }

  async downloadImage(url: string, filename: string, doc?: any) {
    if (doc && doc.isPaymentPending) {
      const choice = await this.confirmDialog.confirm({
        title: 'Document Locked',
        message: 'Almost there! Your document is ready, but there\'s a pending balance on this service. You can securely pay online now or contact your account manager for assistance.',
        confirmText: 'Pay Online',
        cancelText: 'Call Account Manager'
      });
      
      if (choice === true) {
        window.open('/client/wallet', '_self');
      } else if (choice === false) {
        window.open('/client/support', '_self');
      }
      return;
    }

    this.activeLoadingAction.set(`download-${filename}`);
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
    } finally {
      this.activeLoadingAction.set(null);
    }
  }
}
