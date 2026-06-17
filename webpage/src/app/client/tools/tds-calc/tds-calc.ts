import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { CalculatorIcon, Calendar01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-tds-calc',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './tds-calc.html',
  styleUrl: './tds-calc.css',
})
export class TdsCalc {
  CalculatorIcon = CalculatorIcon;
  Calendar01Icon = Calendar01Icon;

  amount = signal<number | null>(null);
  formattedAmount = signal<string>('');
  calcType = signal<'deduction' | 'payment' | 'filing'>('deduction');
  date1 = signal<string>('');
  date2 = signal<string>('');

  onAmountInput(event: any) {
    const input = event.target;
    let rawValue = input.value.replace(/[^0-9.]/g, '');
    
    const parts = rawValue.split('.');
    if (parts.length > 2) {
      rawValue = parts[0] + '.' + parts[1];
    }

    if (rawValue === '') {
      this.amount.set(null);
      this.formattedAmount.set('');
      return;
    }

    this.amount.set(parseFloat(rawValue));

    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? '.' + parts[1] : '';
    
    if (integerPart) {
      integerPart = Number(integerPart).toLocaleString('en-IN');
    }
    
    const cursorPosition = input.selectionStart;
    const oldLength = input.value.length;
    
    const newValue = integerPart + decimalPart;
    this.formattedAmount.set(newValue);
    
    setTimeout(() => {
      const newLength = input.value.length;
      const addedCommas = newLength - oldLength;
      const newCursorPos = Math.max(0, cursorPosition + addedCommas);
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  safeAmount = computed(() => this.amount() || 0);

  monthsDelay = computed(() => {
    if (!this.date1() || !this.date2()) return 0;
    const d1 = new Date(this.date1());
    const d2 = new Date(this.date2());
    const timeDiff = d2.getTime() - d1.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (daysDiff > 0) {
      return Math.ceil(daysDiff / 30);
    }
    return 0;
  });

  daysDelay = computed(() => {
    if (!this.date1() || !this.date2()) return 0;
    const d1 = new Date(this.date1());
    const d2 = new Date(this.date2());
    const timeDiff = d2.getTime() - d1.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  });

  calculatedInterest = computed(() => {
    let interest = 0;
    if (this.calcType() === 'deduction') {
      interest = this.safeAmount() * 0.01 * this.monthsDelay();
    } else if (this.calcType() === 'payment') {
      interest = this.safeAmount() * 0.015 * this.monthsDelay();
    } else {
      interest = 200 * this.daysDelay();
      if (interest > this.safeAmount()) {
        interest = this.safeAmount();
      }
    }
    return interest;
  });

  detailMessage = computed(() => {
    if (this.calcType() === 'deduction') {
      return '1% p.m. from Date of Payment to Date of Deduction';
    } else if (this.calcType() === 'payment') {
      return '1.5% p.m. from Date of Deduction to Date of Payment';
    } else {
      return `₹200 per day for ${this.daysDelay()} days (Max: Tax Amount)`;
    }
  });

  date1Label = computed(() => {
    if (this.calcType() === 'payment') return 'Date Of Tax Deduction';
    if (this.calcType() === 'filing') return 'Due Date Of Filing';
    return 'Date Of Amount Payment';
  });

  date2Label = computed(() => {
    if (this.calcType() === 'payment') return 'Date Of Tax Payment';
    if (this.calcType() === 'filing') return 'Actual Date Of Filing';
    return 'Date Of Tax Deduction';
  });

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/client/dashboard']);
  }
}
