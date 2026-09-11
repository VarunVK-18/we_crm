const fs = require('fs');

const dynamic_ts = 'c:/projects/we_crm/webpage/src/app/client/forms/dynamic-form/client-dynamic-form.ts';
const dynamic_html = 'c:/projects/we_crm/webpage/src/app/client/forms/dynamic-form/client-dynamic-form.html';
const dynamic_css = 'c:/projects/we_crm/webpage/src/app/client/forms/dynamic-form/client-dynamic-form.css';

const mca_ts = 'c:/projects/we_crm/webpage/src/app/client/forms/mca-form/mca-form.ts';
const mca_html = 'c:/projects/we_crm/webpage/src/app/client/forms/mca-form/mca-form.html';
const mca_css = 'c:/projects/we_crm/webpage/src/app/client/forms/mca-form/mca-form.css';

let html_content = fs.readFileSync(dynamic_html, 'utf-8');
html_content = html_content.replace(/onBack\(\)/g, 'goBack()');
fs.writeFileSync(mca_html, html_content, 'utf-8');

let ts_content = fs.readFileSync(dynamic_ts, 'utf-8');

ts_content = ts_content.replace('ClientDynamicFormComponent', 'McaFormComponent');
ts_content = ts_content.replace(/selector:\s*'app-client-dynamic-form',/g, "selector: 'app-mca-form',");
ts_content = ts_content.replace(/templateUrl:\s*'\.\/client-dynamic-form\.html',/g, "templateUrl: './mca-form.html',");
ts_content = ts_content.replace(/styleUrls:\s*\['\.\.\/forms-shared\.css',\s*'\.\/client-dynamic-form\.css'\]/g, "styleUrls: ['../forms-shared.css', './mca-form.css']");

ts_content = ts_content.replace("import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';", "import { Component, OnInit, signal, inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';");

ts_content = ts_content.replace(
  'export class McaFormComponent implements OnInit {', 
  'export class McaFormComponent implements OnInit {\n  @Input() isEmbedded = false;\n  @Output() formCompleted = new EventEmitter<void>();\n'
);

const oldLoadDataStart = ts_content.indexOf('  loadData() {');
const oldLoadDataEnd = ts_content.indexOf('  fetchFormSchema(serviceName: string) {');
const newLoadData = `  loadData() {
    this.loading.set(true);
    this.errorMessage.set('');

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try { this.currentUser = JSON.parse(savedUser); } catch (e) {}
    }

    if (this.orderId()) {
      this.api.get<any>(\`checklists/\${this.orderId()}\`).subscribe({
        next: (orderRes: any) => {
          this.order = orderRes?.checklist || orderRes?.order || orderRes;
          this.serviceName.set('Company Profile');
          this.fetchFormSchema('Company Profile');
        },
        error: (err: any) => {
          this.serviceName.set('Company Profile');
          this.fetchFormSchema('Company Profile');
        }
      });
    } else {
      this.serviceName.set('Company Profile');
      this.fetchFormSchema('Company Profile');
    }
  }

  fetchProfileData() {
    const entityName = this.currentUser?.companyName || 'All Entities';
    this.api.get<any>(\`entity-profile?entityName=\${encodeURIComponent(entityName)}\`).subscribe({
      next: (res: any) => {
        if (res && res.profile) {
          const profile = res.profile;
          
          if (profile.entityName) this.formData['companyName'] = profile.entityName;
          if (profile.pan) this.formData['companyPan'] = profile.pan;
          if (profile.cin) this.formData['cin'] = profile.cin;
          if (profile.incorporationDate) this.formData['incorporationDate'] = profile.incorporationDate;
          if (profile.email) this.formData['companyEmail'] = profile.email;
          if (profile.phone) this.formData['companyPhone'] = profile.phone;
          if (profile.address) this.formData['registeredAddress'] = profile.address;
          if (profile.gstin) this.formData['gstin'] = profile.gstin;
          if (profile.directorName) this.formData['directorName'] = profile.directorName;
          if (profile.directorEmail) this.formData['directorEmail'] = profile.directorEmail;
          if (profile.directorPhone) this.formData['directorMobile'] = profile.directorPhone;
          if (profile.directorPan) this.formData['directorPan'] = profile.directorPan;
          if (profile.directorDin) this.formData['directorDin'] = profile.directorDin;

          if (profile.dynamicProfileData) {
            Object.assign(this.formData, profile.dynamicProfileData);
          }

          const mapExistingDoc = (docIdKey, docNameKey, formField) => {
             if (profile[docIdKey]) {
                this.existingDocs[formField] = { fileUrl: profile[docIdKey], name: profile[docNameKey] || 'Uploaded Document' };
             } else if (profile.dynamicProfileData && profile.dynamicProfileData[\`\${formField}File\`]) {
                this.existingDocs[formField] = { fileUrl: profile.dynamicProfileData[\`\${formField}File\`], name: 'Uploaded Document' };
             }
          };

          mapExistingDoc('incorpCertDocId', 'incorpCertDocName', 'coi');
          mapExistingDoc('panCardDocId', 'panCardDocName', 'pan');
          mapExistingDoc('directorPanDocId', 'directorPanDocName', 'directorPanDoc');
          mapExistingDoc('aadhaarDocId', 'aadhaarDocName', 'aadhaar');
          mapExistingDoc('gstDocId', 'gstDocName', 'gstCert');
          mapExistingDoc('bankDocId', 'bankDocName', 'bankStatement');
          mapExistingDoc('moaDocId', 'moaDocName', 'moa');
          mapExistingDoc('aoaDocId', 'aoaDocName', 'aoa');
        }
      },
      error: (err: any) => console.error('Error fetching profile:', err)
    });
  }
`;
ts_content = ts_content.substring(0, oldLoadDataStart) + newLoadData + ts_content.substring(oldLoadDataEnd);

ts_content = ts_content.replace('this.loadSavedDraft();', 'this.loadSavedDraft();\n        this.fetchProfileData();');

const oldSubmitStart = ts_content.indexOf('    const payload = new FormData();');
const oldSubmitEnd = ts_content.indexOf('  }', ts_content.indexOf('this.api.post(`orders/${this.orderId()}/submit-dynamic-form`, payload).subscribe({'));
const newSubmit = `    const formDataPayload = new FormData();
    Object.keys(this.formData).forEach(key => {
      formDataPayload.append(key, this.formData[key]);
    });
    if (this.currentUser?.companyName) {
      formDataPayload.append('entityName', this.currentUser.companyName);
    }
    Object.keys(this.files).forEach(key => {
      formDataPayload.append(key, this.files[key]);
    });
    Object.keys(this.existingDocs).forEach(key => {
      formDataPayload.append(\`\${key}_existing\`, this.existingDocs[key].fileUrl);
    });

    const apiCall = this.orderId() 
      ? this.api.post<any>(\`orders/\${this.orderId()}/submit-mca-form\`, formDataPayload)
      : this.api.post<any>(\`users/me/mca-profile\`, formDataPayload);

    apiCall.subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        if (res && res.success !== false) {
          this.success.set(true);
          if (this.orderId()) {
            this.draftService.clearDraft(this.orderId(), \`DynamicForm_\${this.serviceName()}\`);
          }
          if (this.isEmbedded) {
            setTimeout(() => {
              this.formCompleted.emit();
            }, 1000);
          } else {
            setTimeout(() => {
              if (this.orderId()) {
                this.router.navigate(['/client/service', this.orderId()]);
              } else {
                this.router.navigate(['/client/compliance']);
              }
            }, 2000);
          }
        } else {
          this.errorMessage.set(res.message || 'Failed to submit form.');
        }
      },
      error: (err: any) => {
        this.submitting.set(false);
        const msg = err.error?.message || err.message || 'Failed to submit form. Please try again.';
        this.errorMessage.set(msg);
      }
    });
`;

ts_content = ts_content.substring(0, oldSubmitStart) + newSubmit + ts_content.substring(oldSubmitEnd);

ts_content = ts_content.replace('  onBack() {', '  goBack() {\n    this.onBack();\n  }\n\n  onBack() {');

fs.writeFileSync(mca_ts, ts_content, 'utf-8');

let css_content = fs.readFileSync(dynamic_css, 'utf-8');
fs.writeFileSync(mca_css, css_content, 'utf-8');

console.log('Fixed Web Client Files');
