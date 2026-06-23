import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  hideCancel?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  isOpen = signal(false);
  options = signal<ConfirmOptions | null>(null);
  
  private resolveFn: ((value: boolean | null) => void) | null = null;

  confirm(options: ConfirmOptions): Promise<boolean | null> {
    this.options.set({
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isDestructive: false,
      ...options
    });
    this.isOpen.set(true);

    return new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  handleConfirm() {
    this.isOpen.set(false);
    if (this.resolveFn) {
      this.resolveFn(true);
      this.resolveFn = null;
    }
  }

  handleCancel() {
    this.isOpen.set(false);
    if (this.resolveFn) {
      this.resolveFn(false);
      this.resolveFn = null;
    }
  }

  handleDismiss() {
    this.isOpen.set(false);
    if (this.resolveFn) {
      this.resolveFn(null);
      this.resolveFn = null;
    }
  }
}
