import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../api';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  // Loading & Password visibility state
  isLoading = signal(false);
  isPasswordVisible = signal(false);

  // Form inputs
  email = signal('');
  password = signal('');

  // Form validation errors
  emailError = signal('');
  passwordError = signal('');

  // Registration state
  isRegistering = signal(true);

  // Registration form inputs
  ownerName = signal('');
  phone = signal('');
  companyName = signal('');
  companyType = signal('');
  directorCount = signal('');
  stateOfRegistration = signal('');
  registerEmail = signal('');

  // Registration errors
  ownerNameError = signal('');
  phoneError = signal('');
  companyNameError = signal('');
  companyTypeError = signal('');
  directorCountError = signal('');
  stateOfRegistrationError = signal('');
  registerEmailError = signal('');

  // Seeded/Authenticated user state
  loggedInUser = signal<any>(null);

  // Custom AlertDialog simulation state (matching Flutter dialog)
  isDialogVisible = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  dialogIsError = signal(true);

  constructor(private router: Router, private api: Api, private confirmDialog: ConfirmDialogService) {}

  ngOnInit() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        this.loggedInUser.set(parsed);
        if (parsed.role === 'customer') {
          this.router.navigate(['/client-dashboard']).catch(() => {});
        } else {
          this.router.navigate(['/dashboard']).catch(() => {});
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }

  togglePasswordVisibility() {
    this.isPasswordVisible.update(val => !val);
  }

  // Matches Flutter's _showAuthDialog
  showAuthDialog(title: string, message: string, isError: boolean = true) {
    this.dialogTitle.set(title);
    this.dialogMessage.set(message);
    this.dialogIsError.set(isError);
    this.isDialogVisible.set(true);
  }

  closeAuthDialog() {
    this.isDialogVisible.set(false);
  }

  // Matches Flutter's _contactSupport
  contactSupport() {
    const subject = encodeURIComponent('Support Request: CRM Account Access');
    window.location.href = `mailto:kumarvarun43255@gmail.com?subject=${subject}`;
  }

  // Matches Flutter's forgot password trigger
  handleForgotPassword() {
    this.showAuthDialog(
      'Notice',
      'Password reset feature coming soon.',
      false
    );
  }

  // Matches Flutter's _handleSignIn
  async handleSignIn() {
    // Reset errors
    this.emailError.set('');
    this.passwordError.set('');

    let hasError = false;

    // Validate email
    const emailVal = this.email().trim();
    if (!emailVal) {
      this.emailError.set('Email is required');
      hasError = true;
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(emailVal)) {
      this.emailError.set('Enter a valid email address');
      hasError = true;
    }

    // Validate password
    const passwordVal = this.password().trim();
    if (!passwordVal) {
      this.passwordError.set('Password is required');
      hasError = true;
    } else if (passwordVal.length < 6) {
      this.passwordError.set('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) return;

    this.isLoading.set(true);

    try {
      // Connect through type-safe Api service
      const data = await firstValueFrom(this.api.login(emailVal, passwordVal));

      // Successful login
      localStorage.setItem('user', JSON.stringify(data.user));
      this.loggedInUser.set(data.user);

      // Navigate immediately based on role
      if (data.user.role === 'customer') {
        this.router.navigate(['/client-dashboard']).catch(() => {});
      } else {
        this.router.navigate(['/dashboard']).catch(() => {});
      }

    } catch (err: any) {
      console.error('Authentication Error:', err);
      
      let title = 'Sign In Failed';
      let message = 'An unexpected error occurred.';

      if (err.error && err.error.message) {
        message = err.error.message;
      } else if (err.message) {
        message = err.message;
      }

      if (message.toLowerCase().includes('password')) {
        title = 'Wrong Password';
        message = 'The password you entered is incorrect. Please try again.';
      } else if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('exist') || message.toLowerCase().includes('invalid')) {
        title = 'Invalid Account';
        message = "We couldn't find an account matching these credentials.";
      } else if (err.status === 0 || message.toLowerCase().includes('unknown error') || message.toLowerCase().includes('http failure')) {
        title = 'Network Error';
        message = 'Please check your internet connection or make sure the WeCRM backend service is active on port 5001.';
      }

      this.showAuthDialog(title, message, true);
    } finally {
      this.isLoading.set(false);
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.loggedInUser.set(null);
    this.email.set('');
    this.password.set('');
    this.emailError.set('');
    this.passwordError.set('');
  }

  showRegisterForm() {
    this.isRegistering.set(true);
    this.clearErrors();
  }

  showLoginForm() {
    this.isRegistering.set(false);
    this.clearErrors();
  }

  clearErrors() {
    this.emailError.set('');
    this.passwordError.set('');
    this.ownerNameError.set('');
    this.phoneError.set('');
    this.companyNameError.set('');
    this.companyTypeError.set('');
    this.directorCountError.set('');
    this.stateOfRegistrationError.set('');
    this.registerEmailError.set('');
  }

  async handleOnboardingSubmit() {
    // Reset errors
    this.clearErrors();

    let hasError = false;

    // Validate Name
    const ownerVal = this.ownerName().trim();
    if (!ownerVal) {
      this.ownerNameError.set('Name is required');
      hasError = true;
    }

    // Validate Company Name
    const companyVal = this.companyName().trim();
    if (!companyVal) {
      this.companyNameError.set('Company Name is required');
      hasError = true;
    }

    // Validate Email
    const emailVal = this.registerEmail().trim();
    if (!emailVal) {
      this.registerEmailError.set('Email is required');
      hasError = true;
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(emailVal)) {
      this.registerEmailError.set('Enter a valid email address');
      hasError = true;
    }

    // Validate Phone Number
    const phoneVal = this.phone().trim();
    if (!phoneVal) {
      this.phoneError.set('Phone number is required');
      hasError = true;
    } else if (!/^\d+$/.test(phoneVal)) {
      this.phoneError.set('Phone number must contain only numbers');
      hasError = true;
    } else if (phoneVal.length !== 10) {
      this.phoneError.set('Phone number must be exactly 10 digits');
      hasError = true;
    }

    // Validate Service Selection
    const serviceVal = this.companyType().trim();
    if (!serviceVal) {
      this.companyTypeError.set('Please select a service');
      hasError = true;
    }

    if (hasError) return;

    this.isLoading.set(true);

    try {
      const payload = {
        name: ownerVal,
        phone: this.phone().trim(),
        company_name: companyVal,
        company_type: this.companyType().trim(),
        director_count: this.directorCount(),
        state_of_registration: this.stateOfRegistration().trim(),
        email: emailVal
      };

      // Call API using dynamic post method
      await firstValueFrom(this.api.post<any>('auth/client-onboard', payload));

      await this.confirmDialog.confirm({
        title: 'Onboarding Request Submitted',
        message: 'Our team will Reach You soon',
        hideCancel: true
      });

      // Reset registration form inputs
      this.ownerName.set('');
      this.phone.set('');
      this.companyName.set('');
      this.companyType.set('');
      this.directorCount.set('');
      this.stateOfRegistration.set('');
      this.registerEmail.set('');

      this.isRegistering.set(false);

    } catch (err: any) {
      console.error('Onboarding Error:', err);
      let message = 'An unexpected error occurred.';
      if (err.error && err.error.message) {
        message = err.error.message;
      } else if (err.message) {
        message = err.message;
      }
      this.showAuthDialog('Onboarding Failed', message, true);
    } finally {
      this.isLoading.set(false);
    }
  }
}
