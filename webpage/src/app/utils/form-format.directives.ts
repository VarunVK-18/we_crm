import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[appPanFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PanFormatDirective),
      multi: true
    }
  ]
})
export class PanFormatDirective implements Validator {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement;
    let value = input.value;
    
    // Convert to uppercase
    value = value.toUpperCase();
    
    // Remove invalid characters
    value = value.replace(/[^A-Z0-9]/g, '');
    
    // Max length 10
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    if (input.value !== value) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(control.value);
    return isValid ? null : { invalidPan: true };
  }
}

@Directive({
  selector: '[appAadhaarFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AadhaarFormatDirective),
      multi: true
    }
  ]
})
export class AadhaarFormatDirective implements Validator {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement;
    let value = input.value;
    
    // Remove non-numeric
    value = value.replace(/\D/g, '');
    
    // Max length 12
    if (value.length > 12) {
      value = value.substring(0, 12);
    }
    
    if (input.value !== value) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const isValid = /^\d{12}$/.test(control.value);
    return isValid ? null : { invalidAadhaar: true };
  }
}

@Directive({
  selector: '[appPhoneFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneFormatDirective),
      multi: true
    }
  ]
})
export class PhoneFormatDirective implements Validator {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement;
    let value = input.value;
    
    // Remove non-numeric except maybe plus
    value = value.replace(/[^\d+]/g, '');
    
    // Limit to 15 max for international
    if (value.length > 15) {
      value = value.substring(0, 15);
    }
    
    if (input.value !== value) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    // basic validation: length between 10 and 15
    const digitsOnly = control.value.replace(/\D/g, '');
    const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15;
    return isValid ? null : { invalidPhone: true };
  }
}
