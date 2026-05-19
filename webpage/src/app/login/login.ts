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
        this.loggedInUser.set(JSON.parse(savedUser));
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

      // Brief showcase of success before redirect
      this.showAuthDialog('Welcome Back', 'Login successful! Welcome to your WeCRM Dashboard.', false);

      setTimeout(() => {
        this.closeAuthDialog();
        this.router.navigate(['/dashboard']).catch(() => {
          console.log('Dashboard route not registered yet. Logged in successfully.');
        });
      }, 2000);

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
        message = 'Please check your internet connection or make sure the WeCRM backend service is active on port 5000.';
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
}
