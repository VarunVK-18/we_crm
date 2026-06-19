export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return email.includes('@') && email.length > 3;
  }

  static isValidPhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    return /^\d{10}$/.test(phone);
  }

  static isValidPan(pan: string): boolean {
    if (!pan || typeof pan !== 'string') return false;
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
  }

  static scrollToError(elementId: string) {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  }
}
