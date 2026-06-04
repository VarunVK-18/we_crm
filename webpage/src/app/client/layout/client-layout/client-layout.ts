import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ClientSidebarComponent } from '../../components/client-sidebar/client-sidebar';
import { ClientTopbarComponent } from '../../components/client-topbar/client-topbar';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ClientSidebarComponent, ClientTopbarComponent],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css'
})
export class ClientLayoutComponent {}
