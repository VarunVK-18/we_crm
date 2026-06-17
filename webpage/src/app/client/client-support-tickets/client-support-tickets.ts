import { Component, OnInit, signal, computed } from '@angular/core';
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
export class ClientSupportTickets implements OnInit {
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
  completedServices = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Tab State
  activeTab = signal<'All' | 'Pending' | 'Resolved'>('All');

  filteredTickets = computed(() => {
    const tab = this.activeTab();
    const all = this.tickets();
    if (tab === 'All') return all;
    if (tab === 'Pending') return all.filter(t => t.status === 'Pending' || t.status === 'In Progress');
    if (tab === 'Resolved') return all.filter(t => t.status === 'Resolved');
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
  }

  fetchData() {
    if (!this.user) {
      this.errorMessage.set('User profile not loaded.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Fetch Tickets
    this.api.get<any>(`tickets/user/${this.user._id || this.user.id}`).subscribe({
      next: (res) => {
        if (res && res.tickets) {
          this.tickets.set(res.tickets);
        } else {
          this.tickets.set([]);
        }
        this.fetchCompletedServices();
      },
      error: (err) => {
        this.errorMessage.set('Failed to load tickets.');
        this.isLoading.set(false);
      }
    });
  }

  fetchCompletedServices() {
    this.api.get<any>('my-checklists').subscribe({
      next: (res) => {
        if (res && res.checklists) {
          const completed = res.checklists.filter((c: any) => c.status === 'completed');
          this.completedServices.set(completed);
          if (completed.length > 0) {
            this.newTicket.checklistId = completed[0]._id;
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false); // don't fail everything if just services fail
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

    this.api.post(`checklists/${this.newTicket.checklistId}/support-ticket`, payload).subscribe({
      next: (res) => {
        this.closeNewTicketModal();
        this.fetchData();
      },
      error: (err) => {
        alert('Failed to raise ticket.');
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
