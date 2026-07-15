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
import { OcrService } from '../../services/ocr.service';

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
    pan: '',
    gstin: '',
    address: '',
    status: 'active',
    revenue: 0,
    director_count: 0,
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
    'DPIIT', 'DUNS',
    'Trade Mark',
    'GST Registration',
    'ISO',
    'Patent',
    'FSSAI',
    'DSC',
    'IE code',
    'LEI',
    'BIS',
    'RoHS',
    'CE'
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

  // External Client Modal State
  isExternalModalOpen = signal<boolean>(false);
  isExternalSubmitting = signal<boolean>(false);
  isExternalOcrProcessing = signal<boolean>(false);
  externalErrorMessage = signal<string>('');
  externalSuccessMessage = signal<string>('');
  externalCoiFile: File | null = null;
  externalClient = {
    clientName: '',
    clientEmail: '',
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    incorporationDate: '',
    cinNumber: '',
    pan: '',
    tan: '',
    clientPassword: '',
    assignedTo: '',
    entityType: 'Private Limited Company',
    paymentAmount: null as number | null
  };

  constructor(private api: Api, private ocrService: OcrService) {}

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

  colSearch_clientId = signal<string>('');
  colSearch_companyName = signal<string>('');
  colSearch_clientName = signal<string>('');
  colSearch_phone = signal<string>('');
  colSearch_mail = signal<string>('');

  getFilteredClients() {
    const globalQ = this.searchQuery().toLowerCase().trim();
    const qClientId = this.colSearch_clientId().toLowerCase().trim();
    const qCompanyName = this.colSearch_companyName().toLowerCase().trim();
    const qClientName = this.colSearch_clientName().toLowerCase().trim();
    const qPhone = this.colSearch_phone().toLowerCase().trim();
    const qMail = this.colSearch_mail().toLowerCase().trim();

    return this.clients().filter(c => {
      let match = true;
      
      if (globalQ) {
        const matchesGlobal = String(c.owner_name || '').toLowerCase().includes(globalQ) ||
                              String(c.company_name || '').toLowerCase().includes(globalQ) ||
                              String(c.email || '').toLowerCase().includes(globalQ) ||
                              String(c.phone || '').toLowerCase().includes(globalQ);
        if (!matchesGlobal) match = false;
      }
      
      if (qClientId && !String(c.custom_client_id || c._id || '').toLowerCase().includes(qClientId)) match = false;
      if (qCompanyName && !String(c.company_name || 'Individual Account').toLowerCase().includes(qCompanyName)) match = false;
      if (qClientName && !String(c.owner_name || '').toLowerCase().includes(qClientName)) match = false;
      if (qPhone && !String(c.phone || '-').toLowerCase().includes(qPhone)) match = false;
      if (qMail && !String(c.email || '-').toLowerCase().includes(qMail)) match = false;

      return match;
    });
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

  // --- Inline Validation Helpers ---
  isInvalidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(email);
  }

  isInvalidPhone(phone: string): boolean {
    if (!phone) return false;
    const phoneRegex = /^\d+$/;
    return !phoneRegex.test(phone);
  }
  // ---------------------------------


  // --- External Client Logic ---
  openExternalModal() {
    this.isExternalModalOpen.set(true);
    this.externalErrorMessage.set('');
    this.externalSuccessMessage.set('');
    this.externalCoiFile = null;
    this.externalClient = {
      clientName: '',
      clientEmail: '',
      companyName: '',
      companyPhone: '',
      companyEmail: '',
      incorporationDate: '',
      cinNumber: '',
      pan: '',
      tan: '',
      clientPassword: '',
      assignedTo: '',
      entityType: 'Private Limited Company',
      paymentAmount: null as number | null
    };
  }

  closeExternalModal() {
    this.isExternalModalOpen.set(false);
    this.externalErrorMessage.set('');
    this.externalSuccessMessage.set('');
  }

  async handleExternalCoiUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.externalCoiFile = file;
      this.isExternalOcrProcessing.set(true);
      this.externalErrorMessage.set('');
      
      try {
        const details = await this.ocrService.extractIncorporationDetails(file);
        // Autofill form
        if (details.companyName) this.externalClient.companyName = details.companyName;
        if (details.entityType && ['Private Limited Company', 'LLP', 'OPC', 'Proprietorship', 'Other'].includes(details.entityType)) {
          this.externalClient.entityType = details.entityType;
        }
        if (details.incorporationDate) this.externalClient.incorporationDate = details.incorporationDate;
        if (details.cinNumber) this.externalClient.cinNumber = details.cinNumber;
        if (details.pan) this.externalClient.pan = details.pan;
        if (details.tan) this.externalClient.tan = details.tan;
        this.externalSuccessMessage.set('OCR extracted details successfully.');
        setTimeout(() => this.externalSuccessMessage.set(''), 3000);
      } catch (err: any) {
        this.externalErrorMessage.set('OCR failed to extract all details. You can enter them manually.');
      } finally {
        this.isExternalOcrProcessing.set(false);
      }
    }
  }

  submitExternalClient() {
    this.externalErrorMessage.set('');

    if (!this.externalClient.clientEmail || !this.externalClient.companyName || !this.externalClient.clientPassword) {
      this.externalErrorMessage.set('Client Email, Password, and Company Name are required.');
      return;
    }

    if (this.externalClient.clientPassword.length < 6) {
      this.externalErrorMessage.set('Client Password must be at least 6 characters.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.externalClient.clientEmail)) {
      this.externalErrorMessage.set('Please enter a valid Client Email address.');
      return;
    }
    if (this.externalClient.companyEmail && !emailRegex.test(this.externalClient.companyEmail)) {
      this.externalErrorMessage.set('Please enter a valid Company Email address.');
      return;
    }

    // Phone validation (ensure it's digits only if provided, optionally 10 digits)
    const phoneRegex = /^\d+$/;
    if (this.externalClient.companyPhone && !phoneRegex.test(this.externalClient.companyPhone)) {
      this.externalErrorMessage.set('Company Phone must contain only numbers.');
      return;
    }
    // Payment validation
    if (this.externalClient.paymentAmount === null || this.externalClient.paymentAmount < 15000) {
      this.externalErrorMessage.set('Payment amount must be at least 15000.');
      return;
    }
    
    this.isExternalSubmitting.set(true);
    
    const formData = new FormData();
    Object.entries(this.externalClient).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    if (this.externalCoiFile) {
      formData.append('coiFile', this.externalCoiFile);
    }
    
    this.api.post<any>('users/clients/external-onboard', formData).subscribe({
      next: (res) => {
        this.externalSuccessMessage.set('Successfully registered client!');
        this.fetchClients();
        setTimeout(() => {
          this.closeExternalModal();
          this.isExternalSubmitting.set(false);
        }, 2000);
      },
      error: (err) => {
        this.externalErrorMessage.set(err.error?.message || 'Failed to onboard external client.');
        this.isExternalSubmitting.set(false);
      }
    });
  }
  // --- End External Client Logic ---

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
      pan: '',
      gstin: '',
      address: '',
      status: 'active',
      revenue: 0,
      director_count: 0,
      services: [] as string[]
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
    formData.append('pan', this.newClient.pan || '');
    formData.append('gstin', this.newClient.gstin || '');
    formData.append('address', this.newClient.address || '');
    formData.append('status', this.newClient.status || 'active');
    formData.append('revenue', this.newClient.revenue?.toString() || '0');
    formData.append('director_count', this.newClient.director_count?.toString() || '0');
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

