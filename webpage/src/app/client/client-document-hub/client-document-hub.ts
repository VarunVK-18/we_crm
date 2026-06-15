import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../../api';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Search01Icon, File01Icon, Download04Icon } from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-client-document-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent],
  templateUrl: './client-document-hub.html',
  styleUrl: './client-document-hub.css'
})
export class ClientDocumentHub implements OnInit {
  readonly Search01Icon = Search01Icon;
  readonly File01Icon = File01Icon;
  readonly Download04Icon = Download04Icon;

  user = signal<any>(null);
  isLoading = signal<boolean>(true);

  searchQuery = signal<string>('');
  allDocuments = signal<any[]>([]);

  filteredDocuments = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.allDocuments();
    return this.allDocuments().filter(doc =>
      doc.name?.toLowerCase().includes(q) ||
      doc.serviceName?.toLowerCase().includes(q)
    );
  });

  constructor(private router: Router, private api: Api) { }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.user.set(JSON.parse(savedUser));
    this.fetchDocuments();
  }

  fetchDocuments() {
    const uid = this.user()?._id || this.user()?.id;
    if (!uid) return;

    this.api.get<any>('my-checklists').subscribe({
      next: (res: any) => {
        const checklists = res.checklists || [];
        const docs: any[] = [];

        for (const c of checklists) {
          // If payment is pending, we do not show final documents
          const isPaymentPending = (c.dealClosedAmount || 0) > (c.advanceAmountPaid || 0);
          if (isPaymentPending) continue;

          if (c.final_documents && c.final_documents.length > 0) {
            for (const fd of c.final_documents) {
              docs.push({
                ...fd,
                serviceName: c.service_name,
                orderId: c._id,
                date: fd.uploadedAt || c.updatedAt
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

  downloadDocument(doc: any) {
    const baseUrl = (this.api as any).baseUrl || 'http://localhost:5001/api';
    if (doc.document_id) {
      window.open(`${baseUrl}/documents/${doc.document_id}`, '_blank');
    }
  }
}
