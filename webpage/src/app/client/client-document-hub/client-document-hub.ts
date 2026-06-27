import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../../api';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Search01Icon, File01Icon, Download04Icon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';
import { ConfirmDialogService } from '../../confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-client-document-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent],
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
        message: 'Almost there! Your document is ready, but there\'s a pending balance on this service. You can securely pay online now or contact your account manager for assistance.',
        confirmText: 'Pay Online',
        cancelText: 'Call Account Manager'
      });
      
      if (choice === true) {
        // Pay Online logic
        window.open('/client/wallet', '_self'); // or wherever they should go to pay
      } else if (choice === false) {
        // Call Account Manager logic
        window.open('/client/support', '_self'); // or support route
      }
      return;
    }

    const baseUrl = (this.api as any).baseUrl || 'http://localhost:5001/api';
    if (doc.document_id) {
      window.open(`${baseUrl}/documents/${doc.document_id}`, '_blank');
    }
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
