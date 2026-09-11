import os

WEB_DIR = r"c:\projects\we_crm\webpage\src\app\client\forms"

dynamic_ts = os.path.join(WEB_DIR, "dynamic-form", "client-dynamic-form.ts")
dynamic_html = os.path.join(WEB_DIR, "dynamic-form", "client-dynamic-form.html")
dynamic_css = os.path.join(WEB_DIR, "dynamic-form", "client-dynamic-form.css")

mca_ts = os.path.join(WEB_DIR, "mca-form", "mca-form.ts")
mca_html = os.path.join(WEB_DIR, "mca-form", "mca-form.html")
mca_css = os.path.join(WEB_DIR, "mca-form", "mca-form.css")

with open(dynamic_ts, 'r', encoding='utf-8') as f:
    ts_content = f.read()

with open(dynamic_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

with open(dynamic_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

# Refactor TS
ts_content = ts_content.replace("ClientDynamicFormComponent", "McaFormComponent")
ts_content = ts_content.replace("selector: 'app-client-dynamic-form',", "selector: 'app-mca-form',")
ts_content = ts_content.replace("templateUrl: './client-dynamic-form.html',", "templateUrl: './mca-form.html',")
ts_content = ts_content.replace("styleUrls: ['../forms-shared.css', './client-dynamic-form.css']", "styleUrls: ['../forms-shared.css', './mca-form.css']")

# Replace loadData to force 'Company Profile' schema
load_data_replacement = """
  @Input() isEmbedded = false;
  @Output() formCompleted = new import('@angular/core').EventEmitter<void>();

  loadData() {
    this.loading.set(true);
    this.errorMessage.set('');

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try { this.currentUser = JSON.parse(savedUser); } catch (e) {}
    }

    if (this.orderId()) {
      this.api.get<any>(`checklists/${this.orderId()}`).subscribe({
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
"""

# Replace submit logic to hit users/me/mca-profile via FormData
submit_logic_replacement = """
    const formDataPayload = new FormData();
    Object.keys(payload).forEach(key => {
      formDataPayload.append(key, payload[key]);
    });
    
    // Add entityName from profile if available
    if (this.currentUser?.companyName) {
      formDataPayload.append('entityName', this.currentUser.companyName);
    }
    
    Object.keys(this.files).forEach(key => {
      formDataPayload.append(key, this.files[key]);
    });
    Object.keys(this.existingDocs).forEach(key => {
      formDataPayload.append(`${key}_existing`, this.existingDocs[key].fileUrl);
    });

    const apiCall = this.orderId() 
      ? this.api.post<any>(`orders/${this.orderId()}/submit-mca-form`, formDataPayload)
      : this.api.post<any>(`users/me/mca-profile`, formDataPayload);

    apiCall.subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        if (res && res.success !== false) {
          this.success.set(true);
          if (this.orderId()) {
            this.draftService.clearDraft(this.orderId()!, this.constructor.name);
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
"""

# Apply surgical replacements via regex / splits
ts_content = ts_content.replace(ts_content[ts_content.find("loadData() {"):ts_content.find("fetchFormSchema(serviceName: string) {")], load_data_replacement)

# Cut the old api post
start_submit = ts_content.find("this.api.post(`orders/${this.orderId()}")
end_submit = ts_content.find("});", start_submit) + 3
ts_content = ts_content.replace(ts_content[start_submit:end_submit], submit_logic_replacement)

# Also ensure we don't strictly require `payload` as JSON, we're using FormData.
# Actually `client-dynamic-form` builds `payload` correctly. 

# Fix Input/Output import
ts_content = ts_content.replace("import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';", "import { Component, OnInit, signal, inject, ChangeDetectorRef, Input, Output } from '@angular/core';")

with open(mca_ts, 'w', encoding='utf-8') as f:
    f.write(ts_content)

with open(mca_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

with open(mca_css, 'w', encoding='utf-8') as f:
    f.write(css_content)

print("MCA web form successfully converted to use dynamic-form logic.")
