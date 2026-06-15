import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class ConfirmDialogComponent {
  constructor(public confirmService: ConfirmDialogService) {}

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: Event) {
    if (this.confirmService.isOpen()) {
      this.confirmService.handleCancel();
    }
  }
}
