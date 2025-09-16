import { Routes } from '@angular/router';
import { Home } from './home/home';
import { LandingComponent } from './landing/landing.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'home', component: Home },
];
