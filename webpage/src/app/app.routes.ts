import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { ClientDashboard } from './client/client-dashboard';
import { ClientServiceDetail } from './client/client-service-detail';
import { ClientProfile } from './client/client-profile';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'client-dashboard', component: ClientDashboard },
  { path: 'client/profile', component: ClientProfile },
  { path: 'client/service/:id', component: ClientServiceDetail },
];
