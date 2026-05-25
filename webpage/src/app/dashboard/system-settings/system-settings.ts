import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-settings.html',
  styleUrl: './system-settings.css'
})
export class SystemSettings implements OnInit {
  user = signal<any>(null);
  settings = signal<any>({
    incorporation_fee: 5000,
    default_filing_tax: 18,
    allow_agent_registration: true,
    require_document_verification: true
  });

  constructor(private api: Api) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
    this.fetchSettings();
  }

  fetchSettings() {
    this.api.get<any>('settings').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.settings.set(res.settings);
        }
      },
      error: (err) => {
        console.error('Failed to fetch settings:', err);
      }
    });
  }

  saveSettings() {
    this.api.post<any>('settings', this.settings()).subscribe({
      next: (res) => {
        alert('Settings saved successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to save settings.');
      }
    });
  }
}
