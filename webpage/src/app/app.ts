import { Component, signal, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog';
import { MobilePromoComponent } from './mobile-promo/mobile-promo';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialogComponent, MobilePromoComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('webpage');
  isMobileDevice = signal(false);

  ngOnInit() {
    this.checkIfMobile();
  }

  private checkIfMobile() {
    if (typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
      // Basic detection for iOS and Android
      if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
        this.isMobileDevice.set(true);
      }
    }
  }

  @HostListener('document:dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault(); // Prevent default to allow drop
    const target = event.target as HTMLElement;
    const fileGroup = target.closest('.file-group, .file-upload-group');
    
    // Clear previous drag-overs
    document.querySelectorAll('.drag-over').forEach(el => {
      if (el !== fileGroup) el.classList.remove('drag-over');
    });

    if (fileGroup) {
      fileGroup.classList.add('drag-over');
    }
  }

  @HostListener('document:dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    const target = event.target as HTMLElement;
    const fileGroup = target.closest('.file-group, .file-upload-group');
    if (fileGroup) {
      const related = event.relatedTarget as Node;
      if (!fileGroup.contains(related)) {
        fileGroup.classList.remove('drag-over');
      }
    }
  }

  @HostListener('document:drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault(); // Prevent browser from opening file
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    
    const target = event.target as HTMLElement;
    const fileGroup = target.closest('.file-group, .file-upload-group');
    
    if (fileGroup && event.dataTransfer?.files?.length) {
      const input = fileGroup.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        input.files = event.dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
}
