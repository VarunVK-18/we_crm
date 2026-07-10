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
import { ComplianceCalendarComponent } from './client/tools/compliance-calendar/compliance-calendar';
import { TrademarkFinder } from './client/tools/trademark-finder/trademark-finder';
import { IncorpForm } from './client/forms/incorp-form/incorp-form';

import { LlpForm } from './client/forms/llp-form/llp-form';
import { MsmeForm } from './client/forms/msme-form/msme-form';
import { FssaiForm } from './client/forms/fssai-form/fssai-form';
import { TrademarkForm } from './client/forms/trademark-form/trademark-form';
import { GstForm } from './client/forms/gst-form/gst-form';
import { IsoForm } from './client/forms/iso-form/iso-form';
import { DscForm } from './client/forms/dsc-form/dsc-form';
import { OpcForm } from './client/forms/opc-form/opc-form';
import { GstComplianceForm } from './client/forms/gst-compliance-form/gst-compliance-form';
import { LeiForm } from './client/forms/lei-form/lei-form';
import { BisForm } from './client/forms/bis-form/bis-form';
import { McaFormComponent } from './client/forms/mca-form/mca-form';
import { ProprietorshipForm } from './client/forms/proprietorship-form/proprietorship-form';
import { TdsForm } from './client/forms/tds-form/tds-form';
import { ItrForm } from './client/forms/itr-form/itr-form';
import { CeRohsForm } from './client/forms/ce-rohs-form/ce-rohs-form';
import { PfForm } from './client/forms/pf-form/pf-form';
import { PatentForm } from './client/forms/patent-form/patent-form';
import { GstCancellationForm } from './client/forms/gst-cancellation-form/gst-cancellation-form';
import { GstFilingForm } from './client/forms/gst-filing-form/gst-filing-form';
import { IecForm } from './client/forms/iec-form/iec-form';
import { DpiitForm } from './client/forms/dpiit-form/dpiit-form';
import { DunsForm } from './client/forms/duns-form/duns-form';
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
import { TeamServiceTrackComponent } from './dashboard/team-service-track/team-service-track';
import { Opportunities } from './dashboard/opportunities/opportunities';
import { BannerManagement } from './dashboard/banner-management/banner-management';
import { DscTokens } from './dashboard/dsc-tokens/dsc-tokens';

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
      { path: 'team-service-track', component: TeamServiceTrackComponent },
      { path: 'settings', component: SystemSettings },
      { path: 'staff-compliance', component: StaffCompliance },
      { path: 'opportunities', loadComponent: () => import('./dashboard/opportunities/opportunities').then(m => m.Opportunities) },
      { path: 'banners', loadComponent: () => import('./dashboard/banner-management/banner-management').then(m => m.BannerManagement) },
      { path: 'dsc-tokens', component: DscTokens },
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
      { path: 'forms/opc/:id', component: OpcForm },
      { path: 'forms/gst-compliance/:id', component: GstComplianceForm },
      { path: 'forms/lie/:id', component: LeiForm },
      { path: 'forms/lei/:id', component: LeiForm },
      { path: 'forms/bis/:id', component: BisForm },
      { path: 'forms/mca/:id', component: McaFormComponent },
      { path: 'forms/proprietorship/:id', component: ProprietorshipForm },
      { path: 'forms/tds/:id', component: TdsForm },
      { path: 'forms/itr/:id', component: ItrForm },
      { path: 'forms/ce-rohs/:id', component: CeRohsForm },

      { path: 'forms/pf/:id', component: PfForm },
      { path: 'forms/patent/:id', component: PatentForm },
      { path: 'forms/gst-cancellation/:id', component: GstCancellationForm },
      { path: 'forms/gst-filing/:id', component: GstFilingForm },
      { path: 'forms/iec/:id', component: IecForm },
      { path: 'forms/dpiit/:id', component: DpiitForm },
      { path: 'forms/duns/:id', component: DunsForm },
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
      { path: 'tools/compliance-calendar', component: ComplianceCalendarComponent },
      { path: 'tools/trademark-finder', component: TrademarkFinder },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  // Redirect old routes for backward compatibility
  { path: 'client-dashboard', redirectTo: 'client/dashboard', pathMatch: 'full' },
];
