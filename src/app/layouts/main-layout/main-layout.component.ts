import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { MensajesService } from '../../core/services/mensajes.service';
import { ThemeService } from '../../core/services/theme.service';
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

  // Feedback / recomendaciones
  feedbackAbierto = false;
  feedbackTexto = '';
  feedbackEnviando = false;
  feedbackEnviado = false;

  constructor(
    private authService: AuthService,
    private onboarding: OnboardingService,
    private mensajesService: MensajesService,
    private theme: ThemeService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
  }

  get isDark(): boolean { return this.theme.isDark; }
  toggleTheme(): void { this.theme.toggle(); }

  abrirFeedback() { this.feedbackAbierto = true; }

  cerrarFeedback() {
    this.feedbackAbierto = false;
    this.feedbackTexto = '';
    this.feedbackEnviado = false;
  }

  enviarFeedback() {
    if (!this.feedbackTexto.trim()) return;
    this.feedbackEnviando = true;
    this.mensajesService.enviar(this.feedbackTexto).subscribe({
      next: () => {
        this.feedbackEnviado = true;
        this.feedbackEnviando = false;
        this.feedbackTexto = '';
        this.cdr.detectChanges();
        setTimeout(() => this.cerrarFeedback(), 2000);
      },
      error: () => {
        this.feedbackEnviando = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    if (!this.isAdmin) {
      this.onboarding.checkAndStart();
    }

    // Cerrar sidebar al navegar en móviles
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.sidebarOpen = false;
      }
    });
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  logout() { this.authService.logout(); }

  get rolLabel(): string {
    const map: any = { productor: 'Productor', asociacion: 'Asociación', institucion: 'Institución', admin: 'Administrador' };
    return map[this.currentUser?.rol || ''] || '';
  }

  get isAdmin(): boolean { return this.currentUser?.rol === 'admin'; }
}
