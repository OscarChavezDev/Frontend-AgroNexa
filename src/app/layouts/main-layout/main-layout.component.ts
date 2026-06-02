import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: false
})
export class MainLayoutComponent implements OnInit {
  sidebarOpen = false;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private onboarding: OnboardingService,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
  }

  ngOnInit(): void {
    if (!this.isAdmin) {
      this.onboarding.checkAndStart();
    }
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  logout() { this.authService.logout(); }

  get rolLabel(): string {
    const map: any = { productor: 'Productor', asociacion: 'Asociación', institucion: 'Institución', admin: 'Administrador' };
    return map[this.currentUser?.rol || ''] || '';
  }

  get isAdmin(): boolean { return this.currentUser?.rol === 'admin'; }
}
