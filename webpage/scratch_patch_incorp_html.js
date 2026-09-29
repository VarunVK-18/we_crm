const fs = require('fs');

const path = 'c:\\\\projects\\\\we_crm\\\\webpage\\\\src\\\\app\\\\client\\\\forms\\\\incorp-form\\\\incorp-form.html';
let c = fs.readFileSync(path, 'utf8');

const oldHtml = `                  @if ($index === 0) {
                    <div class="form-group full-width">
                      <label>Authorized Signatory? *</label>
                      <div class="radio-group" style="display: flex; gap: 16px; margin-top: 8px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;">
                          <input type="radio" name="isAuthSignatory_{{$index}}" value="Yes" [(ngModel)]="d.isAuthSignatory" required>
                          Yes
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;">
                          <input type="radio" name="isAuthSignatory_{{$index}}" value="No" [(ngModel)]="d.isAuthSignatory" required>
                          No
                        </label>
                      </div>
                    </div>
                  }`;

const newHtml = `                  <div class="form-group full-width">
                    <label>Authorized Signatory? *</label>
                    <div class="radio-group" style="display: flex; gap: 16px; margin-top: 8px;">
                      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;">
                        <input type="radio" name="isAuthSignatory_{{$index}}" value="Yes" [(ngModel)]="d.isAuthSignatory" (ngModelChange)="onAuthSignatoryChange($index, $event)" required>
                        Yes
                      </label>
                      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;">
                        <input type="radio" name="isAuthSignatory_{{$index}}" value="No" [(ngModel)]="d.isAuthSignatory" (ngModelChange)="onAuthSignatoryChange($index, $event)" required>
                        No
                      </label>
                    </div>
                  </div>`;

c = c.replace(oldHtml, newHtml);
fs.writeFileSync(path, c, 'utf8');
console.log('Patched incorp-form.html');
