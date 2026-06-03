import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../api';
import { firstValueFrom } from 'rxjs';

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
  isRegistering = signal(false);

  // Registration form inputs
  companyCode = signal('');
  companyName = signal('');
  gstin = signal('');
  ownerName = signal('');
  registerEmail = signal('');
  registerPassword = signal('');
  phone = signal('');
  address = signal('');

  // Registration errors
  companyCodeError = signal('');
  companyNameError = signal('');
  gstinError = signal('');
  ownerNameError = signal('');
  registerEmailError = signal('');
  registerPasswordError = signal('');
  phoneError = signal('');
  addressError = signal('');

  // Seeded/Authenticated user state
  loggedInUser = signal<any>(null);

  // Custom AlertDialog simulation state (matching Flutter dialog)
  isDialogVisible = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  dialogIsError = signal(true);

  constructor(private router: Router, private api: Api) {}

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
    this.companyCodeError.set('');
    this.companyNameError.set('');
    this.gstinError.set('');
    this.ownerNameError.set('');
    this.registerEmailError.set('');
    this.registerPasswordError.set('');
    this.phoneError.set('');
    this.addressError.set('');
  }

  async handleRegisterCompany() {
    // Reset errors
    this.clearErrors();

    let hasError = false;

    // Validate Company Code
    const codeVal = this.companyCode().trim();
    if (!codeVal) {
      this.companyCodeError.set('Company Code is required');
      hasError = true;
    } else if (codeVal.length < 2) {
      this.companyCodeError.set('Code must be at least 2 characters');
      hasError = true;
    }

    // Validate Company Name
    const companyVal = this.companyName().trim();
    if (!companyVal) {
      this.companyNameError.set('Company Name is required');
      hasError = true;
    }

    // Validate Owner Name
    const ownerVal = this.ownerName().trim();
    if (!ownerVal) {
      this.ownerNameError.set('Owner Name is required');
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

    // Validate Password
    const passwordVal = this.registerPassword().trim();
    if (!passwordVal) {
      this.registerPasswordError.set('Password is required');
      hasError = true;
    } else if (passwordVal.length < 6) {
      this.registerPasswordError.set('Password must be at least 6 characters');
      hasError = true;
    }

    // Validate GST (optional, but if present must be 15 chars)
    const gstinVal = this.gstin().trim();
    if (gstinVal && gstinVal.length !== 15) {
      this.gstinError.set('GSTIN must be exactly 15 characters');
      hasError = true;
    }

    if (hasError) return;

    this.isLoading.set(true);

    try {
      const payload = {
        company_code: codeVal,
        company_name: companyVal,
        gstin: gstinVal,
        owner_name: ownerVal,
        email: emailVal,
        password: passwordVal,
        phone: this.phone().trim(),
        address: this.address().trim()
      };

      // Call API using dynamic post method
      await firstValueFrom(this.api.post<any>('auth/register-company', payload));

      this.showAuthDialog(
        'Registration Successful',
        `Company "${companyVal}" has been registered successfully! You can now log in.`,
        false
      );

      // Reset registration form inputs
      this.companyCode.set('');
      this.companyName.set('');
      this.gstin.set('');
      this.ownerName.set('');
      this.registerEmail.set('');
      this.registerPassword.set('');
      this.phone.set('');
      this.address.set('');

      // Redirect to login view after success dialog
      setTimeout(() => {
        this.closeAuthDialog();
        this.isRegistering.set(false);
        // Pre-fill email for login convenience
        this.email.set(emailVal);
      }, 2500);

    } catch (err: any) {
      console.error('Registration Error:', err);
      let message = 'An unexpected registration error occurred.';
      if (err.error && err.error.message) {
        message = err.error.message;
      } else if (err.message) {
        message = err.message;
      }
      this.showAuthDialog('Registration Failed', message, true);
    } finally {
      this.isLoading.set(false);
    }
  }
}
