import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Search01Icon, PlusSignIcon, CheckmarkCircle02Icon, TrendingUpDownIcon, Mail01Icon, UserAccountIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './opportunities.html',
  styleUrl: './opportunities.css'
})
export class Opportunities implements OnInit {
  searchQuery = signal<string>('');
  clients = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  
  readonly Search01Icon = Search01Icon;
  readonly PlusSignIcon = PlusSignIcon;
  readonly CheckmarkCircle02Icon = CheckmarkCircle02Icon;
  readonly TrendingUpDownIcon = TrendingUpDownIcon;
  readonly Mail01Icon = Mail01Icon;
  readonly UserAccountIcon = UserAccountIcon;

  // We will combine all categories of services here
  allServices = [
    { category: 'Incorporation', name: 'Private Limited Incorporation', desc: 'Full-scale incorporation service' },
    { category: 'Incorporation', name: 'LLP Incorporation', desc: 'Statutory compliance for LLPs' },
    { category: 'Incorporation', name: 'OPC', desc: 'One Person Company registration' },
    { category: 'Incorporation', name: 'MSME', desc: 'Udyam Registration for SMEs' },
    { category: 'Compliance', name: 'MCA Compliance', desc: 'Annual return filings and MCA compliance' },
    { category: 'Compliance', name: 'TDS', desc: 'TDS return filing and certificate issuance' },
    { category: 'Compliance', name: 'PF', desc: 'Provident Fund registration and monthly compliance' },
    { category: 'IP', name: 'Copyright', desc: 'Protection for original creative literary or artistic works' },
    { category: 'IP', name: 'Trademark', desc: 'Brand protection and trademark registration' }
  ];

  filteredClients = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.clients();
    return this.clients().filter(c => 
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.company_name && c.company_name.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  });

  constructor(private api: Api) {}

  ngOnInit() {
    this.fetchClients();
  }

  fetchClients() {
    this.api.get<any>('users/clients').subscribe({
      next: (res) => {
        if (res && res.clients) {
          const enhancedClients = res.clients.map((client: any) => {
            return {
              ...client,
              opportunities: this.generateOpportunitiesForClient(client)
            };
          });
          this.clients.set(enhancedClients);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching clients', err);
        this.isLoading.set(false);
      }
    });
  }

  generateOpportunitiesForClient(client: any) {
    // Shuffle and pick 3 to suggest
    const shuffled = [...this.allServices].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(service => ({ ...service, suggested: false }));
  }
  
  suggestService(client: any, opportunity: any) {
    // Instead of a true backend call for now, we just mark it visually as suggested
    opportunity.suggested = true;
    
    // Simulate API call delay
    setTimeout(() => {
       // Optional: could create a notification or chat message to the client here via backend
    }, 500);
  }
}
