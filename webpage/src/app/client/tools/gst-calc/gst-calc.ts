import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { CalculatorIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-gst-calc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gst-calc.html',
  styleUrl: './gst-calc.css',
})
export class GstCalc {
  CalculatorIcon = CalculatorIcon;

  amount = signal<number | null>(null);
  gstRate = signal<number>(18);
  taxType = signal<'exclusive' | 'inclusive'>('exclusive');

  onAmountInput(event: any) {
    const input = event.target;
    let rawValue = input.value.replace(/[^0-9.]/g, '');
    
    const parts = rawValue.split('.');
    if (parts.length > 2) {
      rawValue = parts[0] + '.' + parts[1];
    }

    if (rawValue === '') {
      this.amount.set(null);
      input.value = '';
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
    input.value = newValue;
    
    const newLength = newValue.length;
    const addedCommas = newLength - oldLength;
    const newCursorPos = Math.max(0, cursorPosition + addedCommas);
    input.setSelectionRange(newCursorPos, newCursorPos);
  }

  safeAmount = computed(() => this.amount() || 0);

  gstAmount = computed(() => {
    if (this.taxType() === 'exclusive') {
      return (this.safeAmount() * this.gstRate()) / 100;
    } else {
      return this.safeAmount() - (this.safeAmount() * (100 / (100 + this.gstRate())));
    }
  });

  actualAmount = computed(() => {
    if (this.taxType() === 'exclusive') {
      return this.safeAmount();
    } else {
      return this.safeAmount() - this.gstAmount();
    }
  });

  totalAmount = computed(() => {
    if (this.taxType() === 'exclusive') {
      return this.safeAmount() + this.gstAmount();
    } else {
      return this.safeAmount();
    }
  });

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/client/dashboard']);
  }
}
