import { Component, OnInit, signal, input, Output, EventEmitter } from '@angular/core';
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
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-clients-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent],
  templateUrl: './clients-directory.html',
  styleUrl: './clients-directory.css'
})
export class ClientsDirectory implements OnInit {
  @Output() onViewClient = new EventEmitter<string>();
  @Output() onOpenChat = new EventEmitter<string>();
  isLoading = signal<boolean>(true);
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

  isCreateModalOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  selectedGstinFile: File | null = null;
  selectedPanFile: File | null = null;

  // Assign Manager Modal State
  isAssignManagerModalOpen = signal<boolean>(false);
  assignManagerErrorMessage = signal<string>('');
  assignManagerSuccessMessage = signal<string>('');
  assignManagerSelectedClient = signal<any>(null);
  assignManagerSelectedEmployee = signal<string>('');

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
    'Private Limited Incorporation',
    'LLP Incorporation',
    'OPC',
    'MSME',
    'Proprietorship',
    'MCA Compliance',
    'TDS',
    'PF',
    'Copyright',
    'GST Compliance',
    'GST Cancelation',
    'GST filing',
    'ITR',
    'DPIIT',
    'Trade Mark',
    'GST Registration',
    'ISO',
    'Patent',
    'FSSAI',
    'DSC',
    'IE code',
    'LEI',
    'BIS',
    'ROSH & CE'
  ];

  // Task Creation Modal inside clients context
  isCreateTaskModalOpen = signal<boolean>(false);
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskClientId = '';
  newTaskAssignedTo = '';
  taskErrorMessage = signal<string>('');
  taskSuccessMessage = signal<string>('');

  // Assign Service Modal State
  isAssignServiceModalOpen = signal<boolean>(false);
  assignServiceErrorMessage = signal<string>('');
  assignServiceSuccessMessage = signal<string>('');
  assignServiceClientId = '';
  assignServiceSelected = '';
  assignServiceDealAmount = 0;

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
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch clients:', err);
        this.isLoading.set(false);
      }
    });
  }

  openMail(email: string, event: Event) {
    event.stopPropagation();
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  }

  openPhone(phone: string, event: Event) {
    event.stopPropagation();
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  openChat(clientId: string, event: Event) {
    event.stopPropagation();
    this.onOpenChat.emit(clientId);
  }

  getFilteredClients() {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.clients();
    }
    return this.clients().filter(c => 
      String(c.owner_name || '').toLowerCase().includes(query) ||
      String(c.company_name || '').toLowerCase().includes(query) ||
      String(c.email || '').toLowerCase().includes(query) ||
      String(c.phone || '').toLowerCase().includes(query)
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

    this.isSubmitting.set(true);
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
          this.isSubmitting.set(false);
        }, 1200);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to create client.');
        this.isSubmitting.set(false);
      }
    });
  }

  assignClientToEmployee(clientId: string, employeeId: string) {
    this.api.patch<any>(`users/clients/${clientId}/assign`, { employee_id: employeeId || null }).subscribe({
      next: (res) => {
        this.fetchClients();
        this.assignManagerSuccessMessage.set('Client mapped to manager successfully!');
        setTimeout(() => {
          this.isAssignManagerModalOpen.set(false);
          this.assignManagerSelectedClient.set(null);
        }, 1200);
      },
      error: (err) => {
        this.assignManagerErrorMessage.set(err.error?.message || 'Failed to assign client.');
      }
    });
  }

  openAssignManagerModal(client: any) {
    this.assignManagerSelectedClient.set(client);
    this.assignManagerSelectedEmployee.set(client.assigned_to?._id || client.assigned_to || '');
    this.assignManagerErrorMessage.set('');
    this.assignManagerSuccessMessage.set('');
    this.isAssignManagerModalOpen.set(true);
  }

  submitAssignManager() {
    this.assignManagerErrorMessage.set('');
    this.assignManagerSuccessMessage.set('');
    const client = this.assignManagerSelectedClient();
    if (!client) return;

    this.assignClientToEmployee(client._id, this.assignManagerSelectedEmployee());
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

  openAssignServiceModal(clientId: string) {
    this.assignServiceClientId = clientId;
    this.assignServiceSelected = '';
    this.assignServiceDealAmount = 0;
    this.assignServiceErrorMessage.set('');
    this.assignServiceSuccessMessage.set('');
    this.isAssignServiceModalOpen.set(true);
  }

  submitAssignService() {
    this.assignServiceErrorMessage.set('');
    this.assignServiceSuccessMessage.set('');
    if (!this.assignServiceClientId || !this.assignServiceSelected) {
      this.assignServiceErrorMessage.set('Please select a service.');
      return;
    }

    const payload = new FormData();
    payload.append('service_name', this.assignServiceSelected);
    payload.append('deal_closed_amount', String(this.assignServiceDealAmount || 0));

    this.api.post<any>(`users/profile/${this.assignServiceClientId}/subscribe-service`, payload).subscribe({
      next: (res) => {
        this.assignServiceSuccessMessage.set('Service assigned & Checklist created!');
        this.fetchClients();
        setTimeout(() => {
          this.isAssignServiceModalOpen.set(false);
        }, 1200);
      },
      error: (err) => {
        this.assignServiceErrorMessage.set(err.error?.message || 'Failed to assign service.');
      }
    });
  }

  viewClientDashboard(client: any) {
    this.onViewClient.emit(client._id);
  }
}

