import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../../api';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Search01Icon, File01Icon, Download04Icon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';
import { ConfirmDialogService } from '../../confirm-dialog/confirm-dialog.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-client-document-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent, PdfViewerModule],
  templateUrl: './client-document-hub.html',
  styleUrl: './client-document-hub.css'
})
export class ClientDocumentHub implements OnInit, OnDestroy {
  readonly Search01Icon = Search01Icon;
  readonly File01Icon = File01Icon;
  readonly Download04Icon = Download04Icon;

  user = signal<any>(null);
  isLoading = signal<boolean>(true);

  searchQuery = signal<string>('');
  allDocuments = signal<any[]>([]);

  // Document Viewer State
  isDocViewerOpen = signal<boolean>(false);
  isDocViewerLoading = signal<boolean>(false);
  docViewerSrc: string = '';
  docViewerName: string = '';
  docViewerType = signal<'pdf' | 'image' | ''>('');

  // Scroll Animation State
  logoOpacity = signal<number>(1);
  logoTranslate = signal<number>(0);
  isSearchStuck = signal<boolean>(false);

  // Entity filter synced with topbar switcher
  selectedEntity = signal<string>(localStorage.getItem('client_selected_entity') || 'All');
  private entityChangeHandler = (e: Event) => {
    this.selectedEntity.set((e as CustomEvent).detail as string);
  };

  filteredDocuments = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sel = this.selectedEntity();

    let docs = this.allDocuments();

    // Filter by entity
    if (sel !== 'All') {
      docs = docs.filter(doc => (doc.entityName || '').toLowerCase() === sel.toLowerCase());
    }

    // Filter by search query
    if (q) {
      docs = docs.filter(doc =>
        doc.name?.toLowerCase().includes(q) ||
        doc.serviceName?.toLowerCase().includes(q)
      );
    }

    return docs;
  });

  constructor(
    private router: Router,
    private api: Api,
    private confirmDialog: ConfirmDialogService
  ) { }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    
    // Fade out logo (fade out completely by 120px scroll)
    const opacity = Math.max(0, 1 - (scrollTop / 120));
    this.logoOpacity.set(opacity);
    
    // Slight parallax effect for logo
    this.logoTranslate.set(scrollTop * 0.4);
    
    // Check if search is stuck (approximate threshold where logo is scrolled past)
    this.isSearchStuck.set(scrollTop > 100);
  }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.user.set(JSON.parse(savedUser));
    this.fetchDocuments();
    window.addEventListener('entityChanged', this.entityChangeHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('entityChanged', this.entityChangeHandler);
  }

  fetchDocuments() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;

    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        const docs: any[] = [];

        for (const c of checklists) {
          const isPaymentPending = (c.dealClosedAmount || 0) > (c.advanceAmountPaid || 0);

          const entityName = (
            c.details?.entityName ||
            c.details?.companyName ||
            c.details?.proposed_company_name ||
            c.details?.businessName ||
            c.details?.entity_name ||
            c.entityName || c.companyName || ''
          ).trim();

          if (c.final_documents && c.final_documents.length > 0) {
            for (const fd of c.final_documents) {
              docs.push({
                ...fd,
                serviceName: c.service_name,
                entityName: entityName,
                orderId: c._id,
                date: fd.uploadedAt || c.updatedAt,
                isPaymentPending
              });
            }
          }
        }

        // Sort newest first
        docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.allDocuments.set(docs);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch checklists:', err);
        this.isLoading.set(false);
      }
    });
  }

  async downloadDocument(doc: any) {
    if (doc.isPaymentPending) {
      const choice = await this.confirmDialog.confirm({
        title: 'Document Locked',
        message: 'Almost there! Your document is ready, but there\'s a pending balance on this service. Please contact support for assistance.',
        confirmText: 'Contact Support',
        hideCancel: true
      });

      if (choice === true) {
        window.open('/client/support', '_self');
      }
      return;
    }

    const baseUrl = (this.api as any).baseUrl || 'http://localhost:5001/api';
    if (doc.document_id) {
      const finalUrl = `${baseUrl}/documents/${doc.document_id}`;
      this.docViewerName = doc.name || 'Document';
      this.docViewerType.set('');
      this.isDocViewerLoading.set(true);
      this.isDocViewerOpen.set(true);

      // Detect file type via magic bytes for guaranteed accuracy
      try {
        const res = await fetch(finalUrl, { headers: { 'Range': 'bytes=0-3' } });
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // PDF magic: %PDF
        if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
          this.docViewerType.set('pdf');
          // JPEG magic
        } else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
          this.docViewerType.set('image');
          // PNG magic
        } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          this.docViewerType.set('image');
          // GIF magic
        } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
          this.docViewerType.set('image');
        } else {
          const cType = res.headers.get('content-type') || '';
          if (cType.includes('pdf')) this.docViewerType.set('pdf');
          else if (cType.includes('image')) this.docViewerType.set('image');
        }
      } catch (e) {
        // Fallback heuristics
        const lowerName = (doc.name || '').toLowerCase();
        if (lowerName.includes('pdf') || finalUrl.includes('pdf')) {
          this.docViewerType.set('pdf');
        } else if (lowerName.match(/\.(jpg|jpeg|png|gif|webp)/) || lowerName.includes('photo') || lowerName.includes('signature')) {
          this.docViewerType.set('image');
        }
      }

      this.docViewerSrc = finalUrl;
      this.isDocViewerLoading.set(false);
    }
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

  formatTitleCase(text: string): string {
    if (!text) return text;
    const lowerWords = ['of', 'and', 'is', 'the', 'in', 'on', 'at', 'to', 'for', 'a', 'an'];
    return text.toLowerCase().split(' ').map((word, index) => {
      if (index > 0 && lowerWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }
}
