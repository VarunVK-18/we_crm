import { Component, signal, computed, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface NicCode {
  code: string;
  description: string;
  type: string;
  section: string;
  sectionTitle: string;
}

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nic-finder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './nic-finder.html',
  styleUrl: './nic-finder.css',
})
export class NicFinder {
  searchQuery = signal('');

  allNicCodes = signal<NicCode[]>([]);

  filteredCodes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const codes = this.allNicCodes();
    if (!query) {
      return codes;
    }
    return codes.filter(c => 
      c.code.toLowerCase().includes(query) || 
      c.description.toLowerCase().includes(query)
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
    this.http.get<any>('assets/json/NIC_2008_classification.json').subscribe({
      next: (data) => {
        const codes: NicCode[] = [];
        const sections = data?.NIC_2008?.sections || [];
        for (const sec of sections) {
          for (const div of sec.divisions || []) {
            if (div.division) {
              codes.push({
                code: div.division,
                description: div.title,
                type: 'Division',
                section: sec.section || '',
                sectionTitle: sec.title || ''
              });
            }
            for (const grp of div.groups || []) {
              if (grp.code) {
                codes.push({
                  code: grp.code,
                  description: grp.description,
                  type: 'Group',
                  section: sec.section || '',
                  sectionTitle: sec.title || ''
                });
              }
              for (const cls of grp.classes || []) {
                if (cls.code) {
                  codes.push({
                    code: cls.code,
                    description: cls.description,
                    type: 'Class',
                    section: sec.section || '',
                    sectionTitle: sec.title || ''
                  });
                }
                for (const sub of cls.sub_classes || []) {
                  if (sub.code) {
                    codes.push({
                      code: sub.code,
                      description: sub.description,
                      type: 'Sub-class',
                      section: sec.section || '',
                      sectionTitle: sec.title || ''
                    });
                  }
                }
              }
            }
          }
        }
        this.allNicCodes.set(codes);
      },
      error: (err) => console.error('Failed to load NIC codes:', err)
    });
  }



  goBack() {
    this.location.back();
  }
}
