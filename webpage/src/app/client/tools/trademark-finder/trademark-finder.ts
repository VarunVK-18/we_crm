import { Component, signal, computed, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface TrademarkClass {
  classCode: number;
  description: string;
  type: string;
}

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-trademark-finder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trademark-finder.html',
  styleUrl: './trademark-finder.css',
})
export class TrademarkFinder implements OnInit {
  searchQuery = signal('');

  allClasses = signal<TrademarkClass[]>([]);

  filteredClasses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const classes = this.allClasses();
    if (!query) {
      return classes;
    }
    return classes.filter(c => 
      c.classCode.toString().includes(query) || 
      c.description.toLowerCase().includes(query) ||
      c.type.toLowerCase().includes(query)
    );
  });

  showScrollTop = signal(false);

  constructor(public location: Location, private http: HttpClient, private el: ElementRef) {}

  @HostListener('scroll')
  onScroll() {
    const scrollTop = this.el.nativeElement.scrollTop;
    this.showScrollTop.set(scrollTop > 300);
  }

  scrollToTop() {
    this.el.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnInit() {
    this.http.get<any>('assets/json/Trade Marks Classification.json').subscribe({
      next: (data) => {
        const classes: TrademarkClass[] = [];
        
        if (data && data.goods) {
          for (const item of data.goods) {
            classes.push({
              classCode: item.class,
              description: item.description,
              type: 'Goods'
            });
          }
        }
        
        if (data && data.services) {
          for (const item of data.services) {
            classes.push({
              classCode: item.class,
              description: item.description,
              type: 'Services'
            });
          }
        }
        
        this.allClasses.set(classes);
      },
      error: (err) => console.error('Failed to load Trademark classes:', err)
    });
  }

  goBack() {
    this.location.back();
  }
}
