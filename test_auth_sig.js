class MockConfirmDialog {
  confirm(opts) {
    this.lastConfirm = opts;
  }
}

class MockIncorpForm {
  constructor() {
    this.directors = [];
    this.confirmDialog = new MockConfirmDialog();
  }

  addDirector() {
    this.directors.push({
      fullName: '',
      isAuthSignatory: this.directors.length === 0 ? 'Yes' : 'No'
    });
  }

  onAuthSignatoryChange(changedIndex, newValue) {
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
          message: 'Only one Authorized Signatory is allowed.',
          confirmText: 'Got it',
          hideCancel: true
        });
      }
    }
  }
}

function runTests() {
  console.log('| Test Case | Director 1 | Director 2 | Director 3 | Popup Shown? | Result |');
  console.log('|---|---|---|---|---|---|');

  const form = new MockIncorpForm();
  form.addDirector(); // index 0, should be Yes
  form.addDirector(); // index 1, should be No
  form.addDirector(); // index 2, should be No

  let d1 = form.directors[0].isAuthSignatory;
  let d2 = form.directors[1].isAuthSignatory;
  let d3 = form.directors[2].isAuthSignatory;
  let popup = form.confirmDialog.lastConfirm ? 'Yes' : 'No';
  let passed = (d1 === 'Yes' && d2 === 'No' && d3 === 'No' && popup === 'No');
  console.log('| Initial State (Dir 1 is AS) | ' + d1 + ' | ' + d2 + ' | ' + d3 + ' | ' + popup + ' | ' + (passed ? '✅ Pass' : '❌ Fail') + ' |');

  // Test: User selects Yes for Director 2
  form.confirmDialog.lastConfirm = null;
  form.onAuthSignatoryChange(1, 'Yes');
  form.directors[1].isAuthSignatory = 'Yes';
  
  d1 = form.directors[0].isAuthSignatory;
  d2 = form.directors[1].isAuthSignatory;
  d3 = form.directors[2].isAuthSignatory;
  popup = form.confirmDialog.lastConfirm ? 'Yes' : 'No';
  passed = (d1 === 'No' && d2 === 'Yes' && d3 === 'No' && popup === 'Yes');
  console.log('| User selects Yes for Dir 2 | ' + d1 + ' | ' + d2 + ' | ' + d3 + ' | ' + popup + ' | ' + (passed ? '✅ Pass' : '❌ Fail') + ' |');

  // Test: User selects Yes for Director 3
  form.confirmDialog.lastConfirm = null;
  form.onAuthSignatoryChange(2, 'Yes');
  form.directors[2].isAuthSignatory = 'Yes';

  d1 = form.directors[0].isAuthSignatory;
  d2 = form.directors[1].isAuthSignatory;
  d3 = form.directors[2].isAuthSignatory;
  popup = form.confirmDialog.lastConfirm ? 'Yes' : 'No';
  passed = (d1 === 'No' && d2 === 'No' && d3 === 'Yes' && popup === 'Yes');
  console.log('| User selects Yes for Dir 3 | ' + d1 + ' | ' + d2 + ' | ' + d3 + ' | ' + popup + ' | ' + (passed ? '✅ Pass' : '❌ Fail') + ' |');
}

runTests();
