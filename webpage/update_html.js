const fs = require('fs');
const file = 'src/app/dashboard/checklist-details/checklist-details.html';
let html = fs.readFileSync(file, 'utf8');

const dynamicFormBlock = `
      @if (checklist().details?.dynamicForm) {
      <section style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
        <details
          style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;"
          class="collapsible-card" open>
          <summary
            style="padding: 20px 24px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 600; color: var(--text-primary); list-style: none; user-select: none;">
            <span class="material-symbols-outlined"
              style="font-size: 24px; color: var(--accent-primary);">assignment</span>
            Form Details
            <span class="material-symbols-outlined"
              style="margin-left: auto; color: var(--text-secondary);">expand_more</span>
          </summary>
          <div
            style="padding: 24px; border-top: 1px solid var(--border-color); display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
            @for (field of (checklist().details.dynamicForm | keyvalue); track field.key) {
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">
                {{ formatLabel(field.key) }}
              </span>
              <span style="font-size: 15px; font-weight: 500;"
                [style.color]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '#0369a1' : 'var(--text-primary)'"
                [style.background]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '#f0f9ff' : 'transparent'"
                [style.padding]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '4px 10px' : '0'"
                [style.border-radius]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '6px' : '0'"
                [style.border]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '1px solid #bae6fd' : 'none'">
                <ng-container *ngIf="isObject(field.value); else simpleValue">
                  <pre style="margin: 0; font-family: inherit; font-size: inherit; white-space: pre-wrap; word-break: break-all;">{{ field.value | json }}</pre>
                </ng-container>
                <ng-template #simpleValue>{{ field.value || 'N/A' }}</ng-template>
              </span>
            </div>
            }
          </div>
        </details>
      </section>
      }
`;

const insertionPoint = '<!-- Client Documents Card -->';
if (html.includes(insertionPoint)) {
  html = html.replace(insertionPoint, dynamicFormBlock + '\n      ' + insertionPoint);
  fs.writeFileSync(file, html);
  console.log('Added dynamicForm block to HTML.');
} else {
  console.log('Could not find insertion point.');
}
