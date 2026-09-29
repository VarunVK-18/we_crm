const fs = require('fs');

const path = 'c:\\\\projects\\\\we_crm\\\\webpage\\\\src\\\\app\\\\client\\\\forms\\\\incorp-form\\\\incorp-form.ts';
let c = fs.readFileSync(path, 'utf8');

const oldFn = `  addDirector() {
    this.directors.push({
      fullName: '', fatherName: '', dob: '', placeOfBirth: '', occupation: '',
      education: '', email: '', phone: '', address: '', pan: '', aadhaar: '',
      din: '', shareholding: '', nationality: 'Indian', needDsc: 'Yes', role: 'Director', isAuthSignatory: this.directors.length === 0 ? 'Yes' : 'No'
    });
  }`;

const newFn = `  addDirector() {
    this.directors.push({
      fullName: '', fatherName: '', dob: '', placeOfBirth: '', occupation: '',
      education: '', email: '', phone: '', address: '', pan: '', aadhaar: '',
      din: '', shareholding: '', nationality: 'Indian', needDsc: 'Yes', role: 'Director', isAuthSignatory: this.directors.length === 0 ? 'Yes' : 'No'
    });
  }

  onAuthSignatoryChange(changedIndex: number, newValue: string) {
    if (newValue === 'Yes') {
      let othersChanged = false;
      for (let i = 0; i < this.directors.length; i++) {
        if (i !== changedIndex && this.directors[i].isAuthSignatory === 'Yes') {
          this.directors[i].isAuthSignatory = 'No';
          othersChanged = true;
        }
      }
      if (othersChanged) {
        this.confirmDialog.confirm({
          title: 'Authorized Signatory Updated',
          message: 'Only one Authorized Signatory is allowed. The other director has been automatically set to "No".',
          confirmText: 'Got it',
          hideCancel: true
        });
      }
    }
  }`;

c = c.replace(oldFn, newFn);
fs.writeFileSync(path, c, 'utf8');
console.log('Patched incorp-form.ts');
