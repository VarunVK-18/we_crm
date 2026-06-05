import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { ClientLayoutComponent } from './client/layout/client-layout/client-layout';
import { ClientDashboard } from './client/client-dashboard';
import { ClientServiceDetail } from './client/client-service-detail';
import { ClientProfile } from './client/client-profile';
import { ClientOngoingServices } from './client/client-ongoing-services';
import { ClientCompliance } from './client/client-compliance/client-compliance';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
      { path: 'dashboard', component: ClientDashboard },
      { path: 'profile', component: ClientProfile },
      { path: 'service/:id', component: ClientServiceDetail },
      { path: 'ongoing-services', component: ClientOngoingServices },
      { path: 'compliance', component: ClientCompliance },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  // Redirect old routes for backward compatibility
  { path: 'client-dashboard', redirectTo: 'client/dashboard', pathMatch: 'full' },
];
