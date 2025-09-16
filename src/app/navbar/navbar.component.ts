import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Input() showAuthButtons = false;
  @Input() showPowerButton = false;
  @Output() signInClick = new EventEmitter<void>();
  @Output() signUpClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  onSignInClick() {
    this.signInClick.emit();
  }
  onSignUpClick() {
    this.signUpClick.emit();
  }
  onLogoutClick() {
    this.logoutClick.emit();
  }
}
