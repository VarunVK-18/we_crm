import { Component, signal } from '@angular/core';
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
}
