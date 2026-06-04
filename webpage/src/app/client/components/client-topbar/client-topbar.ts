import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Notification01Icon } from '@hugeicons/core-free-icons';
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

  user = signal<any>(null);
  pageTitle = signal('My Services');
  pageSubtitle = signal('Client Portal Dashboard');

  constructor(private router: Router) {
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
}
