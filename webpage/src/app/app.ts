import { Component, signal, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('webpage');

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
