import { Component, signal, computed, OnInit, HostListener, ElementRef, Input } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../api';
import { WeLoaderComponent } from '../../../components/we-loader/we-loader';

interface ComplianceEvent {
  dueDate: string;
  title: string;
  description: string;
  category: string;
  formsOrSections: string;
  applicableTo: string;
}

@Component({
  selector: 'app-compliance-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WeLoaderComponent],
  templateUrl: './compliance-calendar.html',
  styleUrl: './compliance-calendar.css',
})
export class ComplianceCalendarComponent implements OnInit {
  @Input() isEmbedded = false;
  searchQuery = signal('');
  allEvents = signal<ComplianceEvent[]>([]);
  isLoading = signal(true);
  calendarYear = signal('');

  filteredEvents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const events = this.allEvents();
    if (!query) return events;
    return events.filter(e => 
      (e.title || '').toLowerCase().includes(query) || 
      (e.category || '').toLowerCase().includes(query) ||
      (e.dueDate || '').toLowerCase().includes(query) ||
      (e.description || '').toLowerCase().includes(query)
    );
  });

  showScrollTop = signal(false);

  constructor(public location: Location, private api: Api, private el: ElementRef) {}

  @HostListener('scroll')
  onScroll() {
    const scrollTop = this.el.nativeElement.scrollTop;
    this.showScrollTop.set(scrollTop > 300);
  }

  scrollToTop() {
    this.el.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnInit() {
    this.api.get<any>('calendar/latest').subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.calendar) {
          this.calendarYear.set(res.calendar.year);
          this.allEvents.set(res.calendar.events || []);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to load compliance calendar:', err);
      }
    });
  }

  downloadComplianceCalendar() {
    this.api.get<any>('calendar/latest').subscribe({
      next: (res) => {
        const docId = res?.calendar?.documentId?._id || res?.calendar?.documentId;
        if (docId) {
          const baseUrl = (this.api as any).baseUrl || 'http://localhost:5001/api';
          window.open(`${baseUrl}/documents/${docId}`, '_blank');
        } else {
          alert('Compliance Calendar PDF not found.');
        }
      },
      error: (err) => {
        alert('Compliance Calendar for this year is not uploaded yet.');
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
