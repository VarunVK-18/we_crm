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
