import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  hideCancel?: boolean;
  autoCancelSeconds?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  isOpen = signal(false);
  options = signal<ConfirmOptions | null>(null);
  countdown = signal<number>(0);
  
  private resolveFn: ((value: boolean | null) => void) | null = null;
  private autoCancelTimer: any = null;

  confirm(options: ConfirmOptions): Promise<boolean | null> {
    this.options.set({
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isDestructive: false,
      ...options
    });
    this.isOpen.set(true);
    
    if (this.autoCancelTimer) {
      clearInterval(this.autoCancelTimer);
    }
    this.countdown.set(0);
    
    if (options.autoCancelSeconds) {
      this.countdown.set(options.autoCancelSeconds);
      this.autoCancelTimer = setInterval(() => {
        if (this.isOpen()) {
          const current = this.countdown();
          if (current > 1) {
            this.countdown.set(current - 1);
          } else {
            this.countdown.set(0);
            this.handleCancel();
          }
        }
      }, 1000);
    }

    return new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  handleConfirm() {
    this.isOpen.set(false);
    if (this.autoCancelTimer) clearInterval(this.autoCancelTimer);
    if (this.resolveFn) {
      this.resolveFn(true);
      this.resolveFn = null;
    }
  }

  handleCancel() {
    this.isOpen.set(false);
    if (this.autoCancelTimer) clearInterval(this.autoCancelTimer);
    if (this.resolveFn) {
      this.resolveFn(false);
      this.resolveFn = null;
    }
  }

  handleDismiss() {
    this.isOpen.set(false);
    if (this.autoCancelTimer) clearInterval(this.autoCancelTimer);
    if (this.resolveFn) {
      this.resolveFn(null);
      this.resolveFn = null;
    }
  }
}
