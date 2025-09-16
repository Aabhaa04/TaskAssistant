import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Add this import

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [NavbarComponent, FormsModule, NgIf, HttpClientModule], // Add HttpClientModule
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  activeTab: 'signin' | 'signup' = 'signin';
  showAuthForm = false;

  // Sign In fields
  signinEmail = '';
  signinPassword = '';
  signinError = '';

  // Sign Up fields
  signupName = '';
  signupEmail = '';
  signupPassword = '';
  signupConfirmPassword = '';
  signupError = '';

  private apiUrl = 'http://localhost:5000/api/auth'; // Add this

  constructor(private router: Router, private http: HttpClient) {} // Add HttpClient

  openAuth(tab: 'signin' | 'signup') {
    this.activeTab = tab;
    this.showAuthForm = true;
  }

  // Replace your signIn method with this:
  signIn() {
    this.signinError = '';
    
    if (!this.signinEmail || !this.signinPassword) {
      this.signinError = 'Please fill in all fields.';
      return;
    }

    const signinData = {
      email: this.signinEmail,
      password: this.signinPassword
    };

    this.http.post<any>(`${this.apiUrl}/signin`, signinData).subscribe({
      next: (response) => {
        if (response.success) {
          // Store token and user data
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          
          // Navigate to home
          this.router.navigate(['/home']);
          this.closeAuth();
        } else {
          this.signinError = response.message;
        }
      },
      error: (error) => {
        this.signinError = error.error?.message || 'An error occurred during sign in';
      }
    });
  }

  // Replace your signUp method with this:
  signUp() {
    this.signupError = '';

    // Validation
    if (!this.signupName.trim() || !this.signupEmail.trim() || !this.signupPassword || !this.signupConfirmPassword) {
      this.signupError = 'All fields are required.';
      return;
    }
    if (this.signupPassword !== this.signupConfirmPassword) {
      this.signupError = 'Passwords do not match.';
      return;
    }
    if (this.signupPassword.length < 6) {
      this.signupError = 'Password must be at least 6 characters long.';
      return;
    }

    const signupData = {
      name: this.signupName.trim(),
      email: this.signupEmail.trim(),
      password: this.signupPassword
    };

    this.http.post<any>(`${this.apiUrl}/signup`, signupData).subscribe({
      next: (response) => {
        if (response.success) {
          // Store token and user data
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          
          // Navigate to home
          this.router.navigate(['/home']);
          this.closeAuth();
        } else {
          this.signupError = response.message;
          if (response.errors && response.errors.length > 0) {
            this.signupError = response.errors.join(', ');
          }
        }
      },
      error: (error) => {
        this.signupError = error.error?.message || 'An error occurred during sign up';
        if (error.error?.errors && error.error.errors.length > 0) {
          this.signupError = error.error.errors.join(', ');
        }
      }
    });
  }

  closeAuth() {
    this.showAuthForm = false;
    // Clear form data
    this.signinEmail = '';
    this.signinPassword = '';
    this.signupName = '';
    this.signupEmail = '';
    this.signupPassword = '';
    this.signupConfirmPassword = '';
    this.signinError = '';
    this.signupError = '';
  }
}