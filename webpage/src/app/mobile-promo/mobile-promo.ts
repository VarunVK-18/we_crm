import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-mobile-promo',
  standalone: true,
  templateUrl: './mobile-promo.html',
  styleUrl: './mobile-promo.css'
})
export class MobilePromoComponent implements OnInit {
  
  ngOnInit() {
    this.attemptDeepLink();
  }

  attemptDeepLink() {
    if (typeof window === 'undefined') return;

    const packageName = 'com.softrate.wecrm';
    const fallbackUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

    if (isAndroid) {
      // Try opening the Android intent (opens app directly if installed, otherwise redirects to Play Store)
      window.location.href = `intent://#Intent;scheme=wecrm;package=${packageName};end`;
    } else if (isIOS) {
      // iOS custom scheme try
      window.location.href = 'wecrm://';
      const timeout = setTimeout(() => {
        window.location.href = fallbackUrl;
      }, 2500);

      window.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          clearTimeout(timeout);
        }
      });
    } else {
      // Fallback for other platforms
      window.location.href = fallbackUrl;
    }
  }
}
