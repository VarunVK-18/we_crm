import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.css'
})
export class ClientDashboard implements OnInit, OnChanges {
  @Input() clientId!: string;
  @Output() goBack = new EventEmitter<void>();

  client = signal<any>(null);
  activeTab = signal<string>('overview');
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(private api: Api) {}

  ngOnInit() {
    if (this.clientId) {
      this.fetchClientDetails();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['clientId'] && !changes['clientId'].firstChange) {
      this.fetchClientDetails();
    }
  }

  clientOrders = signal<any[]>([]);

  fetchClientDetails() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          const found = res.clients.find((c: any) => String(c._id) === String(this.clientId));
          if (!found) {
            this.errorMessage.set('Client not found.');
            this.isLoading.set(false);
          } else {
            this.client.set(found);
            // Fetch client's orders to get their entities and services
            this.api.get<any>(`orders/user/${this.clientId}`).subscribe({
              next: (ordersRes) => {
                if (ordersRes && ordersRes.orders) {
                  this.clientOrders.set(ordersRes.orders || []);
                }
                this.isLoading.set(false);
              },
              error: () => {
                // If fetching orders fails, we still have the client data
                this.isLoading.set(false);
              }
            });
          }
        } else {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.errorMessage.set('Failed to load client details.');
        this.isLoading.set(false);
      }
    });
  }

  getInitials(): string {
    const c = this.client();
    if (!c || !c.owner_name) return 'C';
    return c.owner_name.charAt(0).toUpperCase();
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  getAvailableEntityNames(): string[] {
    const orders = this.clientOrders() || [];
    // The company name is actually stored in `entityName` on the order.
    // If it's missing, fallback to the user's main company_name.
    const names = orders.map(o => o.entityName).filter(n => n && n.trim() !== '');
    
    const clientCompany = this.client()?.company_name;
    if (clientCompany && clientCompany.trim() !== '') {
      names.push(clientCompany);
    }
    
    return Array.from(new Set(names));
  }

  getServicesForEntity(entityName: string): string[] {
    if (!entityName) return [];
    const orders = this.clientOrders() || [];
    
    // Filter orders matching this entityName (or if it's the client's default company_name)
    const matchingOrders = orders.filter(o => 
      o.entityName === entityName || 
      (this.client()?.company_name === entityName && !o.entityName)
    );
    
    // The "Entity Type" (e.g. Private Limited, LLP) is in o.serviceType
    const types = matchingOrders.map(o => o.serviceType).filter(Boolean);
    
    // Fallback: If no orders match but it's the user's company, maybe infer from business_type
    if (types.length === 0 && this.client()?.company_name === entityName) {
      if (this.client()?.business_type) {
        types.push(this.client()?.business_type);
      }
    }
    
    return Array.from(new Set(types));
  }

  // --- Entity Management ---
  isEntityFormOpen = signal<boolean>(false);
  editingEntityIndex = signal<number>(-1);
  currentEntity: any = {};

  openEntityForm() {
    this.editingEntityIndex.set(-1);
    this.currentEntity = {
      entityName: '', entityType: '', cin: '', pan: '', tan: '', gstin: '', iso: '', msme: '', fssai: '',
      coi: '', dsc: '', gstUsername: '', gstPassword: '', gstArn: '', itrUsername: '', itrPassword: '',
      dpiitRecognitionNumber: '', dpiitApplicationId: '', trademarkApplicationNumber: '', trademarkStatus: '', trademarkCertificate: '',
      patentApplicationNumber: '', patentStatus: '', patentNumber: '', copyrightRegistrationNumber: '', copyrightCertificate: '',
      tdsUsername: '', tdsPassword: '', pfEstablishmentId: '', pfUsername: '', pfPassword: '',
      fssaiTrackingId: '', fssaiApplicationId: '', msmeCertificate: ''
    };
    this.isEntityFormOpen.set(true);
  }

  closeEntityForm() {
    this.isEntityFormOpen.set(false);
  }

  onEntityNameChange() {
    // When entity name changes, reset entityType
    this.currentEntity.entityType = '';
  }

  editEntity(index: number) {
    this.editingEntityIndex.set(index);
    const ent = this.client().client_entities[index];
    this.currentEntity = { ...ent };
    this.isEntityFormOpen.set(true);
  }

  deleteEntity(index: number) {
    if (confirm('Are you sure you want to delete this entity?')) {
      const updatedEntities = [...(this.client().client_entities || [])];
      updatedEntities.splice(index, 1);
      this.updateEntitiesOnServer(updatedEntities);
    }
  }

  saveEntity() {
    if (!this.currentEntity.entityName) return;
    
    const updatedEntities = [...(this.client().client_entities || [])];
    if (this.editingEntityIndex() >= 0) {
      updatedEntities[this.editingEntityIndex()] = this.currentEntity;
    } else {
      updatedEntities.push(this.currentEntity);
    }
    this.updateEntitiesOnServer(updatedEntities);
  }

  updateEntitiesOnServer(updatedEntities: any[]) {
    this.api.put(`users/profile/${this.clientId}/entities`, { client_entities: updatedEntities })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const currentClient = this.client();
            currentClient.client_entities = updatedEntities;
            this.client.set({ ...currentClient });
            this.closeEntityForm();
          } else {
            alert('Failed to update entities');
          }
        },
        error: (err) => {
          alert('Error updating entities');
          console.error(err);
        }
      });
  }
}
