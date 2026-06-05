import { Component, OnInit, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Notification01Icon, UserAccountIcon, Logout01Icon, ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-client-topbar',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './client-topbar.html',
  styleUrl: './client-topbar.css'
})
export class ClientTopbarComponent implements OnInit {
  readonly Notification01Icon = Notification01Icon;
  readonly UserAccountIcon = UserAccountIcon;
  readonly Logout01Icon = Logout01Icon;
  readonly ArrowDown01Icon = ArrowDown01Icon;
  readonly ArrowUp01Icon = ArrowUp01Icon;

  user = signal<any>(null);
  pageTitle = signal('My Services');
  pageSubtitle = signal('Client Portal Dashboard');
  isDropdownOpen = signal(false);

  constructor(private router: Router, private eRef: ElementRef) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateTitle(event.urlAfterRedirects);
    });
  }

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.updateTitle(this.router.url);
  }

  updateTitle(url: string) {
    if (url.includes('/profile')) {
      this.pageTitle.set('My Profile');
      this.pageSubtitle.set('Account Details & Documents');
    } else if (url.includes('/service/')) {
      this.pageTitle.set('Service Details');
      this.pageSubtitle.set('Track your request progress');
    } else {
      this.pageTitle.set('My Services');
      this.pageSubtitle.set('Client Portal Dashboard');
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getInitials(name: string): string {
    if (!name) return 'WY';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
