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

  expandedStates: Record<string, boolean> = {};

  toggleExpand(code: string) {
    this.expandedStates[code] = !this.expandedStates[code];
  }

  isExpanded(code: string) {
    return !!this.expandedStates[code];
  }

  groupedCodes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const codes = this.allNicCodes();
    
    const classMap = new Map<string, NicCode>();
    codes.forEach(c => {
      if (c.type === 'Class') {
        classMap.set(c.code, c);
      }
    });

    const matchedSet = new Set<NicCode>();
    
    for (const item of codes) {
      if (!query || item.code.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)) {
        if (item.type === 'Class') {
          matchedSet.add(item);
        } else if (item.type === 'Sub-class') {
          const parentCode = item.code.length >= 4 ? item.code.substring(0, 4) : item.code;
          const parent = classMap.get(parentCode) || { ...item, type: 'Class', description: 'Unknown Class', code: parentCode };
          matchedSet.add(parent);
        } else {
          matchedSet.add(item);
        }
      }
    }

    const limited = Array.from(matchedSet).slice(0, 100);

    const groups = limited.map(parent => {
      let children: NicCode[] = [];
      if (parent.type === 'Class') {
        children = codes.filter(n => n.type === 'Sub-class' && n.code.startsWith(parent.code));
      }
      return { parent, children };
    });

    return groups;
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
