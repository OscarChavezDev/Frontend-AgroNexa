import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: false
})
export class LandingComponent implements OnInit {
  isLoggedIn = false;
  userRole = '';

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private authService: AuthService,
    private theme: ThemeService,
    private router: Router
  ) {}

  get isDark(): boolean { return this.theme.isDark; }
  toggleTheme(): void { this.theme.toggle(); }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnInit(): void {
    // SEO optimization
    this.titleService.setTitle('AgroNexa - Diagnóstico Inteligente para tus Cultivos');
    this.metaService.updateTag({
      name: 'description',
      content: 'Optimiza la producción de tus cultivos con AgroNexa. Realiza diagnósticos inteligentes de muestras con IA, monitorea en tiempo real y gestiona tus parcelas de manera eficiente.'
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: 'agricultura, agricultura de precision, inteligencia artificial, diagnostico de cultivos, parcelas, muestras'
    });

    // Check auth status
    this.isLoggedIn = this.authService.isLoggedIn;
    if (this.isLoggedIn && this.authService.currentUser) {
      this.userRole = this.authService.currentUser.rol || '';
    }
  }

  navigateToDashboard(): void {
    if (this.isLoggedIn) {
      if (this.userRole === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
}
