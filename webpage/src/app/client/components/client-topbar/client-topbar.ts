import { Component, OnInit, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Notification01Icon, UserAccountIcon, Logout01Icon, ArrowDown01Icon, ArrowUp01Icon, Message02Icon } from '@hugeicons/core-free-icons';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationService, Notification } from '../../services/notification.service';
import { Api } from '../../../api';

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
  readonly Message02Icon = Message02Icon;

  user = signal<any>(null);
  pageTitle = signal('My Services');
  pageSubtitle = signal('Client Portal Dashboard');
  isDropdownOpen = signal(false);
  isNotificationOpen = signal(false);

  constructor(
    private router: Router, 
    private eRef: ElementRef, 
    public notifService: NotificationService,
    private api: Api
  ) {
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
    this.notifService.startPolling();
  }

  ngOnDestroy() {
    this.notifService.stopPolling();
  }

  updateTitle(url: string) {
    if (url.includes('/profile')) {
      this.pageTitle.set('My Profile');
      this.pageSubtitle.set('Account Details & Documents');
    } else if (url.includes('/service/')) {
      this.pageTitle.set('Service Details');
      this.pageSubtitle.set('Track your request progress');
    } else if (url.includes('/compliance')) {
      this.pageTitle.set('Compliance Center');
      const usr = this.user();
      this.pageSubtitle.set(usr?.company_name || usr?.name || 'Entity Compliance Management');
    } else {
      this.pageTitle.set('My Services');
      this.pageSubtitle.set('Client Portal Dashboard');
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
      this.isNotificationOpen.set(false);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
    this.isNotificationOpen.set(false);
  }

  toggleNotifications() {
    this.isNotificationOpen.update(v => !v);
    this.isDropdownOpen.set(false);
    if (this.isNotificationOpen()) {
      this.notifService.markAllAsRead();
    }
  }

  handleNotificationClick(notification: Notification) {
    if (notification.type === 'chat' && notification.orderId) {
      this.isNotificationOpen.set(false);
      this.router.navigate(['/client/service', notification.orderId]);
    } else if (notification.type === 'document_request' && notification.orderId) {
      // Trigger file picker
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.jpg,.jpeg,.png';
      fileInput.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          this.uploadDocument(file, notification.orderId!);
        }
      };
      fileInput.click();
    }
  }

  uploadDocument(file: File, orderId: string) {
    const formData = new FormData();
    formData.append('document', file);
    
    // Checklists upload logic matches crm_backend routes
    this.api.post(`checklists/${orderId}/upload-documents`, formData).subscribe({
      next: () => {
        alert('Document uploaded successfully!');
        this.notifService.fetchNotifications();
      },
      error: (err) => {
        console.error('Failed to upload document', err);
        alert('Failed to upload document. Please try again.');
      }
    });
  }

  formatTime(timeStr: string): string {
    const time = new Date(timeStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - time.getTime()) / 60000); // in minutes
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
