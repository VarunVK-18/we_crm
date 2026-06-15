import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { ClientLayoutComponent } from './client/layout/client-layout/client-layout';
import { ClientDashboard } from './client/client-dashboard';
import { ClientServiceDetail } from './client/client-service-detail';
import { ClientProfile } from './client/client-profile';
import { ClientOngoingServices } from './client/client-ongoing-services';
import { ClientCompanyDetails } from './client/client-company-details/client-company-details';
import { ClientCompliance } from './client/client-compliance/client-compliance';
import { ClientServicesComponent } from './client/client-services/client-services';
import { ClientSupportTickets } from './client/client-support-tickets/client-support-tickets';
import { ClientHelpSupport } from './client/client-help-support/client-help-support';
import { ClientSubscriptions } from './client/client-subscriptions/client-subscriptions';
import { ClientInvoice } from './client/client-invoice/client-invoice';
import { ClientDocumentHub } from './client/client-document-hub/client-document-hub';
import { GstCalc } from './client/tools/gst-calc/gst-calc';
import { TdsCalc } from './client/tools/tds-calc/tds-calc';
import { NicFinder } from './client/tools/nic-finder/nic-finder';
import { IncorpForm } from './client/forms/incorp-form/incorp-form';
import { LlpForm } from './client/forms/llp-form/llp-form';
import { MsmeForm } from './client/forms/msme-form/msme-form';
import { FssaiForm } from './client/forms/fssai-form/fssai-form';
import { TrademarkForm } from './client/forms/trademark-form/trademark-form';
import { GstForm } from './client/forms/gst-form/gst-form';
import { IsoForm } from './client/forms/iso-form/iso-form';
import { DscForm } from './client/forms/dsc-form/dsc-form';
import { HomeOverview } from './dashboard/home-overview/home-overview';
import { ClientsDirectory } from './dashboard/clients-directory/clients-directory';
import { RequestsComponent } from './dashboard/requests/requests';
import { ServiceChecklists } from './dashboard/service-checklists/service-checklists';
import { CompletedChecklists } from './dashboard/completed-checklists/completed-checklists';
import { FilingTasks } from './dashboard/filing-tasks/filing-tasks';
import { ChecklistDetails } from './dashboard/checklist-details/checklist-details';
import { ClientDashboard as ManagerClientDashboard } from './dashboard/client-dashboard/client-dashboard';
import { AuditLogs } from './dashboard/audit-logs/audit-logs';
import { EmployeesTeam } from './dashboard/employees-team/employees-team';
import { SystemSettings } from './dashboard/system-settings/system-settings';
import { StaffCompliance } from './dashboard/staff-compliance/staff-compliance';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'dashboard', 
    component: Dashboard,
    children: [
      { path: 'overview', component: HomeOverview },
      { path: 'clients', component: ClientsDirectory },
      { path: 'requests', component: RequestsComponent },
      { path: 'service-checklists', component: ServiceChecklists },
      { path: 'completed-checklists', component: CompletedChecklists },
      { path: 'filing-tasks', component: FilingTasks },
      { path: 'checklist-details/:id', component: ChecklistDetails },
      { path: 'client/:id', component: ManagerClientDashboard },
      { path: 'audit-logs', component: AuditLogs },
      { path: 'employees', component: EmployeesTeam },
      { path: 'settings', component: SystemSettings },
      { path: 'staff-compliance', component: StaffCompliance },
      { path: '', redirectTo: 'overview', pathMatch: 'full' }
    ]
  },
  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
      { path: 'dashboard', component: ClientDashboard },
      { path: 'services', component: ClientServicesComponent },
      { path: 'profile', component: ClientProfile },
      { path: 'forms/incorp/:id', component: IncorpForm },
      { path: 'forms/llp/:id', component: LlpForm },
      { path: 'forms/msme/:id', component: MsmeForm },
      { path: 'forms/fssai/:id', component: FssaiForm },
      { path: 'forms/trademark/:id', component: TrademarkForm },
      { path: 'forms/gst/:id', component: GstForm },
      { path: 'forms/iso/:id', component: IsoForm },
      { path: 'forms/dsc/:id', component: DscForm },
      { path: 'service/:id', component: ClientServiceDetail },
      { path: 'ongoing-services', component: ClientOngoingServices },
      { path: 'company-details', component: ClientCompanyDetails },
      { path: 'compliance', component: ClientCompliance },
      { path: 'support-tickets', component: ClientSupportTickets },
      { path: 'support', component: ClientHelpSupport },
      { path: 'subscriptions', component: ClientSubscriptions },
      { path: 'document-hub', component: ClientDocumentHub },
      { path: 'invoice/:id', component: ClientInvoice },
      { path: 'tools/gst-calc', component: GstCalc },
      { path: 'tools/tds-calc', component: TdsCalc },
      { path: 'tools/nic-finder', component: NicFinder },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  // Redirect old routes for backward compatibility
  { path: 'client-dashboard', redirectTo: 'client/dashboard', pathMatch: 'full' },
];
