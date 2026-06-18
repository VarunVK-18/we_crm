import { Component, OnInit, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-service-track',
  standalone: true,
  imports: [CommonModule, WeLoaderComponent],
  templateUrl: './service-track.html',
  styleUrl: './service-track.css'
})
export class ServiceTrackComponent implements OnInit {
  @Output() onViewChecklist = new EventEmitter<string>();

  checklists = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  isFirstLoad = signal<boolean>(true);

  // Grouped checklists by category
  groupedServices = signal<Record<string, any[]>>({
    incorporation: [],
    compliance: [],
    ip: [],
    licensing: [],
    tax: [],
    other: []
  });

  categoryOrder = [
    { id: 'incorporation', label: 'Incorporation' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'ip', label: 'IP' },
    { id: 'licensing', label: 'Licensing' },
    { id: 'tax', label: 'Tax' },
    { id: 'other', label: 'Other' }
  ];

  visibleCategories = signal<string[]>(this.categoryOrder.map(c => c.id));

  servicesDatabase: Record<string, string[]> = {
    'incorporation': ['Proprietorship Registration', 'Partnership Firm Registration', 'Private Limited Incorporation', 'LLP Incorporation', 'OPC', 'MSME Registration', 'Company Incorporation'],
    'compliance': ['MCA Compliance', 'TDS', 'PF', 'DUNS Registration', 'PAN, TAN & Bank Setup', 'Compliance'],
    'ip': ['Trademark Registration', 'Copyright Registration', 'Patent Registration', 'IP'],
    'licensing': ['FSSAI Registration', 'ISO Certification', 'DPIIT Certification', 'IE code', 'LEI', 'BIS', 'ROSH & CE', 'Licensing'],
    'tax': ['GST Onboarding', 'GST Compliance', 'GST Cancelation', 'GST filing', 'ITR', 'Tax'],
    'other': ['Individual DSC', 'Organization DSC', 'Other']
  };

  constructor(private api: Api) {}

  ngOnInit() {
    this.fetchActiveServices();
  }

  fetchActiveServices() {
    if (this.isFirstLoad()) {
      this.isLoading.set(true);
    }
    this.api.get<any>('checklists').subscribe({
      next: (res) => {
        if (res.checklists) {
          // Filter out completed/rejected checklists to only show active ones
          const active = res.checklists.filter((c: any) => c.status !== 'completed' && c.status !== 'rejected' && c.assigned_to);
          this.checklists.set(active);
          this.groupServices(active);
        }
        this.isLoading.set(false);
        this.isFirstLoad.set(false);
      },
      error: (err) => {
        console.error('Error fetching services for kanban', err);
        this.isLoading.set(false);
        this.isFirstLoad.set(false);
      }
    });
  }

  groupServices(services: any[]) {
    const groups: Record<string, any[]> = {
      incorporation: [],
      compliance: [],
      ip: [],
      licensing: [],
      tax: [],
      other: []
    };

    services.forEach(service => {
      const name = service.service_name || service.checklist_name;
      if (!name) return;
      
      let foundCategory = 'other';
      for (const [category, names] of Object.entries(this.servicesDatabase)) {
        if (names.some(n => name.toLowerCase().includes(n.toLowerCase()))) {
          foundCategory = category;
          break;
        }
      }
      groups[foundCategory].push(service);
    });

    this.groupedServices.set(groups);
  }

  getCompletedCount(items: any[]): number {
    if (!items || !items.length) return 0;
    return items.filter(i => i.isChecked).length;
  }

  viewService(id: string) {
    this.onViewChecklist.emit(id);
  }

  toggleCategory(categoryId: string) {
    const current = this.visibleCategories();
    if (current.includes(categoryId)) {
      this.visibleCategories.set(current.filter(id => id !== categoryId));
    } else {
      this.visibleCategories.set([...current, categoryId]);
    }
  }

  selectAllCategories() {
    this.visibleCategories.set(this.categoryOrder.map(c => c.id));
  }
}
