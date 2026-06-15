import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Home07Icon, PackageIcon, Shield01Icon, UserIcon, CustomerSupportIcon, DashboardSquare01Icon, Briefcase02Icon, Building04Icon, MentoringIcon, CrownIcon, File01Icon } from '@hugeicons/core-free-icons';
import { Api } from '../../../api';

@Component({
  selector: 'app-client-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HugeiconsIconComponent],
  templateUrl: './client-sidebar.html',
  styleUrl: './client-sidebar.css'
})
export class ClientSidebarComponent implements OnInit {
  readonly Home07Icon = Home07Icon;
  readonly DashboardSquare01Icon = DashboardSquare01Icon;
  readonly PackageIcon = PackageIcon;
  readonly Shield01Icon = Shield01Icon;
  readonly UserIcon = UserIcon;
  readonly CustomerSupportIcon = CustomerSupportIcon;
  readonly MentoringIcon = MentoringIcon;
  readonly CrownIcon = CrownIcon;
  readonly Building04Icon = Building04Icon;
  readonly File01Icon = File01Icon;

  user = signal<any>(null);
  clientManager = signal<any>(null);

  currentTrustedIndex = signal(0);
  trustedCompanies = [
    {
      name: 'Softrate',
      desc: 'Premium Web & Mobile Application Development to scale your digital presence.',
      image: '/assets/Softrate Logo.png',
      url: 'https://softrateglobal.com'
    },
    {
      name: 'Startup Doctor',
      desc: 'Expert mentorship and tailored strategies to accelerate your startup growth.',
      image: '/assets/sdlogo (1).svg',
      url: 'https://aistartupdoctor.com'
    }
  ];
  
  private slideInterval: any;

  constructor(private router: Router, private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.user.set(parsed);
      this.fetchClientManager(parsed._id || parsed.id);
    }
    this.startSlider();
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  startSlider() {
    this.slideInterval = setInterval(() => {
      this.currentTrustedIndex.update(i => (i + 1) % this.trustedCompanies.length);
    }, 4000);
  }

  fetchClientManager(uid: string) {
    if (!uid) return;
    this.api.get<any>(`users/profile/${uid}`).subscribe({
      next: (res: any) => {
        if (res.user && res.user.assigned_to) {
          this.clientManager.set(res.user.assigned_to);
        }
      },
      error: (err: any) => console.error('Failed to fetch client manager:', err)
    });
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
