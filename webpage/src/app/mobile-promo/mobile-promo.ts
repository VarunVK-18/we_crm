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
    // Attempt to open the Android App via Intent
    // If the app is installed, it opens. If not, it falls back to the Play Store link after a short delay.
    const packageName = 'com.softrate.wecrm'; // TODO: Update to your exact Play Store package name
    const fallbackUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    
    // Set a timeout to redirect to the Play Store if the app fails to open
    const timeout = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = fallbackUrl;
      }
    }, 2000);

    // Try opening the Android intent
    if (typeof window !== 'undefined') {
      window.location.href = `intent://wecrm/#Intent;scheme=wecrm;package=${packageName};end`;
    }

    // Clear timeout if they leave the page (app opened)
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          clearTimeout(timeout);
        }
      });
    }
  }
}
