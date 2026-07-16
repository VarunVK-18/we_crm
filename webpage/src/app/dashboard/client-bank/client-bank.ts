import { ResizableColumnDirective } from '../../directives/resizable-column.directive';
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../api';

@Component({
  selector: 'app-client-bank',
  standalone: true,
  imports: [CommonModule, FormsModule, ResizableColumnDirective],
  templateUrl: './client-bank.html',
  styleUrl: './client-bank.css'
})
export class ClientBank implements OnInit {
  clients = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  // Search filters
  mClientIdFilter = signal<string>('');
  mCompanyNameFilter = signal<string>('');
  mClientNameFilter = signal<string>('');
  mPhoneFilter = signal<string>('');
  mIncDateFilter = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = 10;

  // Modal State
  selectedClient = signal<any>(null);
  isModalOpen = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Form State
  bankName = signal<string>('');
  accountNumber = signal<string>('');
  ifscCode = signal<string>('');
  accountType = signal<string>('');
  branchName = signal<string>('');

  filteredClients = computed(() => {
    let result = this.clients();

    const cidFilter = this.mClientIdFilter().toLowerCase();
    const compFilter = this.mCompanyNameFilter().toLowerCase();
    const nameFilter = this.mClientNameFilter().toLowerCase();
    const phoneFilter = this.mPhoneFilter().toLowerCase();
    const incFilter = this.mIncDateFilter().toLowerCase();

    if (cidFilter) {
      result = result.filter(c => c.custom_client_id?.toLowerCase().includes(cidFilter));
    }
    if (compFilter) {
      result = result.filter(c => c.company_name?.toLowerCase().includes(compFilter));
    }
    if (nameFilter) {
      result = result.filter(c => c.owner_name?.toLowerCase().includes(nameFilter));
    }
    if (phoneFilter) {
      result = result.filter(c => c.phone?.toLowerCase().includes(phoneFilter));
    }
    if (incFilter) {
      result = result.filter(c => {
        const d = this.getIncorporationDate(c);
        if (!d) return false;
        // Check standard date string representation (e.g. "mon oct 24 2023")
        return d.toDateString().toLowerCase().includes(incFilter);
      });
    }

    // Pagination
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return result.slice(startIndex, startIndex + this.pageSize);
  });

  totalPages = computed(() => {
    let result = this.clients();

    const cidFilter = this.mClientIdFilter().toLowerCase();
    const compFilter = this.mCompanyNameFilter().toLowerCase();
    const nameFilter = this.mClientNameFilter().toLowerCase();
    const phoneFilter = this.mPhoneFilter().toLowerCase();
    const incFilter = this.mIncDateFilter().toLowerCase();

    if (cidFilter) result = result.filter(c => c.custom_client_id?.toLowerCase().includes(cidFilter));
    if (compFilter) result = result.filter(c => c.company_name?.toLowerCase().includes(compFilter));
    if (nameFilter) result = result.filter(c => c.owner_name?.toLowerCase().includes(nameFilter));
    if (phoneFilter) result = result.filter(c => c.phone?.toLowerCase().includes(phoneFilter));
    if (incFilter) {
      result = result.filter(c => {
        const d = this.getIncorporationDate(c);
        return d ? d.toDateString().toLowerCase().includes(incFilter) : false;
      });
    }

    return Math.max(1, Math.ceil(result.length / this.pageSize));
  });

  constructor(private api: Api, private router: Router) {}

  viewClient(id: string) {
    if (id) {
      this.router.navigate(['/dashboard/client-details', id]);
    }
  }

  ngOnInit() {
    this.fetchClients();
  }

  fetchClients() {
    this.isLoading.set(true);
    this.api.get<any[]>('users/clients/no-bank-details').subscribe({
      next: (res) => {
        this.clients.set(res || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching clients:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange() {
    this.currentPage.set(1);
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  getIncorporationDate(client: any): Date | null {
    if (client.client_entities && client.client_entities.length > 0) {
      const entity = client.client_entities[0];
      if (entity.incorporationDate) {
        return new Date(entity.incorporationDate);
      }
    }
    return null;
  }

  openModal(client: any) {
    this.selectedClient.set(client);
    this.bankName.set(client.bank_details?.bankName || '');
    this.accountNumber.set(client.bank_details?.accountNumber || '');
    this.ifscCode.set(client.bank_details?.ifscCode || '');
    this.accountType.set(client.bank_details?.accountType || '');
    this.branchName.set(client.bank_details?.branchName || '');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedClient.set(null);
  }

  isFormValid(): boolean {
    return !!(this.bankName() && this.accountNumber() && this.ifscCode() && this.accountType());
  }

  saveBankDetails() {
    if (!this.isFormValid() || !this.selectedClient()) return;

    this.isSaving.set(true);
    const clientId = this.selectedClient()._id;
    
    this.api.patch(`users/clients/${clientId}/bank-details`, {
      bankName: this.bankName(),
      accountNumber: this.accountNumber(),
      ifscCode: this.ifscCode(),
      accountType: this.accountType(),
      branchName: this.branchName()
    }).subscribe({
      next: () => {
        this.clients.update(cls => cls.filter(c => c._id !== clientId));
        this.closeModal();
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Error saving bank details:', err);
        alert('Failed to save bank details. Please try again.');
        this.isSaving.set(false);
      }
    });
  }
}
