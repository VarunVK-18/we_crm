import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  ArrowLeft01Icon, 
  RefreshIcon, 
  PlusSignIcon, 
  Tag01Icon, 
  GridIcon, 
  TextFontIcon,
  SentIcon,
  MessageMultiple01Icon,
  Calendar01Icon,
  Briefcase02Icon,
  MentoringIcon
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-client-support-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, WeLoaderComponent],
  templateUrl: './client-support-tickets.html',
  styleUrl: './client-support-tickets.css'
})
export class ClientSupportTickets implements OnInit, OnDestroy {
  // Icons
  readonly ArrowLeft01Icon = ArrowLeft01Icon;
  readonly RefreshIcon = RefreshIcon;
  readonly PlusSignIcon = PlusSignIcon;
  readonly Tag01Icon = Tag01Icon;
  readonly GridIcon = GridIcon;
  readonly TextFontIcon = TextFontIcon;
  readonly SentIcon = SentIcon;
  readonly MessageMultiple01Icon = MessageMultiple01Icon;
  readonly Calendar01Icon = Calendar01Icon;
  readonly Briefcase02Icon = Briefcase02Icon;
  readonly MentoringIcon = MentoringIcon;

  // State
  tickets = signal<any[]>([]);
  /** All checklists as a SIGNAL so filteredTickets recomputes when they load */
  allChecklists = signal<any[]>([]);
  completedServices = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Entity filter — synced with topbar via custom event
  selectedEntity = signal<string>(localStorage.getItem('client_selected_entity') || 'All');
  private entityChangeHandler = (e: Event) => {
    this.selectedEntity.set((e as CustomEvent).detail as string);
  };

  // Tab State
  activeTab = signal<'All' | 'Pending' | 'Resolved'>('All');

  /**
   * Resolve entity name for a ticket.
   * Chain: ticket.checklistId → checklist.details.entityName (the service belongs to the entity)
   */
  private resolveEntityFromChecklist(checklistId: string): string {
    const checklist = this.allChecklists().find(c => c._id === checklistId);
    if (!checklist) return '';
    return (
      checklist.details?.entityName ||
      checklist.details?.companyName ||
      checklist.details?.proposed_company_name ||
      checklist.details?.businessName ||
      checklist.details?.entity_name ||
      checklist.entityName ||
      checklist.companyName ||
      ''
    ).trim();
  }

  /** Get the entity name for a given ticket */
  resolveTicketEntity(ticket: any): string {
    // 1. If backend populated checklistId as an object, read entity from it directly
    //    (ticket → service → entity chain)
    const clObj = ticket.checklistId;
    if (clObj && typeof clObj === 'object') {
      const name = (
        clObj.details?.entityName ||
        clObj.details?.companyName ||
        clObj.details?.proposed_company_name ||
        clObj.details?.businessName ||
        clObj.details?.entity_name ||
        clObj.entityName ||
        clObj.companyName ||
        ''
      ).trim();
      if (name) return name;
    }

    // 2. Fallback: look up in local allChecklists signal (for older tickets)
    const cId = typeof clObj === 'string' ? clObj : clObj?._id;
    if (cId) {
      const fromLocal = this.resolveEntityFromChecklist(cId);
      if (fromLocal) return fromLocal;
    }

    // 3. Last resort: direct fields on the ticket
    return (ticket.entityName || ticket.entity_name || '').trim();
  }

  filteredTickets = computed(() => {
    const tab = this.activeTab();
    const sel = this.selectedEntity();
    // Reading allChecklists() makes this computed reactive to checklist loads
    const _ = this.allChecklists();
    let all = this.tickets();

    // Apply tab filter
    if (tab === 'Pending') all = all.filter(t => t.status === 'Pending' || t.status === 'In Progress');
    else if (tab === 'Resolved') all = all.filter(t => t.status === 'Resolved');

    // Apply entity filter
    if (sel !== 'All') {
      all = all.filter(t => {
        const entityName = this.resolveTicketEntity(t);
        return entityName.toLowerCase() === sel.toLowerCase();
      });
    }

    return all;
  });

  // New Ticket Modal State
  showNewTicketModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  
  // Form Model
  newTicket = {
    subject: '',
    description: '',
    checklistId: ''
  };

  user: any = null;

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (e) {}
    }
    this.fetchData();
    window.addEventListener('entityChanged', this.entityChangeHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('entityChanged', this.entityChangeHandler);
  }

  fetchData() {
    if (!this.user) {
      this.errorMessage.set('User profile not loaded.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Fetch tickets
    this.api.get<any>(`tickets/user/${this.user._id || this.user.id}`).subscribe({
      next: (res) => {
        this.tickets.set(res?.tickets || []);
        // Fetch checklists so we can resolve entity names
        this.fetchChecklists();
      },
      error: () => {
        this.errorMessage.set('Failed to load tickets.');
        this.isLoading.set(false);
      }
    });
  }

  fetchChecklists() {
    this.api.get<any>('my-checklists').subscribe({
      next: (res) => {
        const checklists: any[] = res?.checklists || [];
        // Store all checklists as a signal — filteredTickets will recompute
        this.allChecklists.set(checklists);

        // Build completed services for the new ticket modal
        const completed = checklists.filter((c: any) => c.status === 'completed');
        this.completedServices.set(completed);

        // Pre-select the service matching the currently active entity
        const sel = this.selectedEntity();
        const relevant = sel === 'All'
          ? completed
          : completed.filter((c: any) => {
              const name = (
                c.details?.entityName ||
                c.details?.companyName ||
                c.details?.proposed_company_name ||
                c.details?.businessName ||
                c.details?.entity_name ||
                c.entityName || c.companyName || ''
              ).trim();
              return name.toLowerCase() === sel.toLowerCase();
            });

        if (relevant.length > 0) {
          this.newTicket.checklistId = relevant[0]._id;
        } else if (completed.length > 0) {
          this.newTicket.checklistId = completed[0]._id;
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openNewTicketModal() {
    if (this.completedServices().length === 0) {
      alert('No completed services available to raise a ticket for.');
      return;
    }
    this.newTicket.subject = '';
    this.newTicket.description = '';
    this.showNewTicketModal.set(true);
  }

  closeNewTicketModal() {
    this.showNewTicketModal.set(false);
    this.isSubmitting.set(false);
  }

  submitNewTicket() {
    if (!this.newTicket.subject.trim() || !this.newTicket.description.trim() || !this.newTicket.checklistId) {
      alert('Please fill out all fields.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      userId: this.user._id || this.user.id,
      userName: this.user.name || this.user.owner_name,
      userEmail: this.user.email,
      subject: this.newTicket.subject.trim(),
      description: this.newTicket.description.trim()
    };

    console.log('[SupportTickets] Submitting ticket:', {
      checklistId: this.newTicket.checklistId,
      payload
    });

    this.api.post<any>(`checklists/${this.newTicket.checklistId}/support-ticket`, payload).subscribe({
      next: (res: any) => {
        this.closeNewTicketModal();
        this.fetchData();
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Unknown error';
        alert(`Failed to raise ticket: ${msg}`);
        this.isSubmitting.set(false);
      }
    });
  }

  setTab(tab: 'All' | 'Pending' | 'Resolved') {
    this.activeTab.set(tab);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
