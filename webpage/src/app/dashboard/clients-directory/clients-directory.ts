import { Component, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  Search01Icon, 
  Mail01Icon, 
  CallIcon, 
  PlusSignIcon, 
  Cancel01Icon,
  CheckmarkCircle02Icon
} from '@hugeicons/core-free-icons';
import { Api } from '../../api';

@Component({
  selector: 'app-clients-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './clients-directory.html',
  styleUrl: './clients-directory.css'
})
export class ClientsDirectory implements OnInit {
  user = signal<any>(null);
  clients = signal<any[]>([]);
  teams = input<any[]>([]);
  searchQuery = signal<string>('');
  
  // Icon assets
  readonly Search01Icon = Search01Icon;
  readonly Mail01Icon = Mail01Icon;
  readonly CallIcon = CallIcon;
  readonly PlusSignIcon = PlusSignIcon;
  readonly Cancel01Icon = Cancel01Icon;
  readonly CheckmarkCircle02Icon = CheckmarkCircle02Icon;

  // Create Client Modal State
  isCreateModalOpen = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  selectedGstinFile: File | null = null;
  selectedPanFile: File | null = null;

  newClient = {
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    company_name: '',
    business_type: '',
    pan: '',
    gstin: '',
    address: '',
    status: 'active',
    revenue: 0,
    services: [] as string[]
  };

  availableServices = [
    'Compliance Audit',
    'GST Reconciliation',
    'Tax Advisory',
    'Corporate Filings',
    'FEMA Advisory'
  ];

  // Task Creation Modal inside clients context
  isCreateTaskModalOpen = signal<boolean>(false);
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskClientId = '';
  newTaskAssignedTo = '';
  taskErrorMessage = signal<string>('');
  taskSuccessMessage = signal<string>('');

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchClients();
  }

  getCompanyId(): string | null {
    const u = this.user();
    if (!u) return null;
    if (u.company_id && typeof u.company_id === 'object') {
      return u.company_id._id || null;
    }
    return u.company_id || null;
  }

  fetchClients() {
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          this.clients.set(res.clients);
        }
      }
    });
  }



  getFilteredClients() {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.clients();
    }
    return this.clients().filter(c => 
      (c.owner_name || '').toLowerCase().includes(query) ||
      (c.company_name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query)
    );
  }

  getFlattenedFilteredClients(): any[] {
    const clients = this.getFilteredClients();
    const flattened: any[] = [];
    for (const c of clients) {
      if (!c.services || c.services.length === 0) {
        flattened.push({ ...c, singleService: null, uniqueId: `${c._id}-no-service` });
      } else {
        for (const srv of c.services) {
          flattened.push({ ...c, singleService: srv, uniqueId: `${c._id}-${srv}` });
        }
      }
    }
    return flattened;
  }

  getServiceSpecificDocuments(client: any): any[] {
    if (!client.onboarding_documents) return [];
    if (!client.singleService) return client.onboarding_documents;
    
    // Filter documents to only include those related to this service
    return client.onboarding_documents.filter((doc: any) => {
      return doc.name && doc.name.startsWith(client.singleService);
    });
  }

  getTotalServicesCount(): number {
    return this.clients().reduce((acc, c) => acc + (c.services?.length || 0), 0);
  }

  getCorporateClientPercentage(): string {
    const total = this.clients().length;
    if (total === 0) return '0%';
    const corporate = this.clients().filter(c => !!c.company_name).length;
    return `${Math.round((corporate / total) * 100)}%`;
  }

  getFlatEmployees() {
    const flat: any[] = [];
    this.teams().forEach(g => {
      if (g.members) {
        flat.push(...g.members);
      }
    });
    return flat;
  }

  openCreateModal() {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedGstinFile = null;
    this.selectedPanFile = null;
    this.newClient = {
      owner_name: '',
      email: '',
      password: '',
      phone: '',
      company_name: '',
      business_type: '',
      pan: '',
      gstin: '',
      address: '',
      status: 'active',
      revenue: 0,
      services: []
    };
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
  }

  toggleService(service: string) {
    const idx = this.newClient.services.indexOf(service);
    if (idx > -1) {
      this.newClient.services.splice(idx, 1);
    } else {
      this.newClient.services.push(service);
    }
  }

  onGstinFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedGstinFile = file;
    }
  }

  onPanFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedPanFile = file;
    }
  }

  submitCreateClient() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.newClient.owner_name || !this.newClient.email) {
      this.errorMessage.set('Name and email are required.');
      return;
    }

    const formData = new FormData();
    formData.append('owner_name', this.newClient.owner_name);
    formData.append('email', this.newClient.email);
    formData.append('password', this.newClient.password || '');
    formData.append('phone', this.newClient.phone || '');
    formData.append('company_name', this.newClient.company_name || '');
    formData.append('business_type', this.newClient.business_type || '');
    formData.append('pan', this.newClient.pan || '');
    formData.append('gstin', this.newClient.gstin || '');
    formData.append('address', this.newClient.address || '');
    formData.append('status', this.newClient.status || 'active');
    formData.append('revenue', String(this.newClient.revenue || 0));
    formData.append('role', 'customer');
    formData.append('services', JSON.stringify(this.newClient.services));

    const companyId = this.getCompanyId();
    if (companyId) {
      formData.append('company_id', companyId);
    }

    if (this.selectedGstinFile) {
      formData.append('gstin_file', this.selectedGstinFile);
    }
    if (this.selectedPanFile) {
      formData.append('pan_file', this.selectedPanFile);
    }

    this.api.register(formData).subscribe({
      next: (res) => {
        this.successMessage.set('Client created successfully!');
        this.fetchClients();
        setTimeout(() => {
          this.closeCreateModal();
        }, 1200);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to create client.');
      }
    });
  }

  assignClientToEmployee(clientId: string, employeeId: string) {
    this.api.patch<any>(`users/clients/${clientId}/assign`, { employee_id: employeeId || null }).subscribe({
      next: (res) => {
        this.fetchClients();
        alert('Client assigned successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to assign client.');
      }
    });
  }

  updateOnboardingStatus(clientId: string, status: string) {
    this.api.patch<any>(`users/clients/${clientId}/onboarding`, { onboarding_status: status }).subscribe({
      next: (res) => {
        this.fetchClients();
        alert('Onboarding status updated!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update onboarding status.');
      }
    });
  }

  openCreateTaskModal(clientId?: string) {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskClientId = clientId || '';
    this.newTaskAssignedTo = '';
    this.taskErrorMessage.set('');
    this.taskSuccessMessage.set('');
    this.isCreateTaskModalOpen.set(true);
  }

  submitCreateTask() {
    this.taskErrorMessage.set('');
    this.taskSuccessMessage.set('');
    if (!this.newTaskClientId || !this.newTaskTitle) {
      this.taskErrorMessage.set('Client and Task Title are required.');
      return;
    }
    const payload = {
      client_id: this.newTaskClientId,
      assigned_to: this.newTaskAssignedTo || null,
      title: this.newTaskTitle,
      description: this.newTaskDescription
    };
    this.api.post<any>('tasks', payload).subscribe({
      next: (res) => {
        this.taskSuccessMessage.set('Task created successfully!');
        setTimeout(() => {
          this.isCreateTaskModalOpen.set(false);
        }, 1200);
      },
      error: (err) => {
        this.taskErrorMessage.set(err.error?.message || 'Failed to create task.');
      }
    });
  }
}
