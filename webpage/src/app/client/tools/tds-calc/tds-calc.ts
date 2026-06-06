import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { CalculatorIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-tds-calc',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent],
  templateUrl: './tds-calc.html',
  styleUrl: './tds-calc.css',
})
export class TdsCalc {
  CalculatorIcon = CalculatorIcon;

  amount = signal<number | null>(null);
  calcType = signal<'deduction' | 'payment' | 'filing'>('deduction');
  date1 = signal<string>('');
  date2 = signal<string>('');

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
