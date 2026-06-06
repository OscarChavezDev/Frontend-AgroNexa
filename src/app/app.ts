import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AnalyticsService } from './core/services/analytics.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>\n             <app-popup></app-popup>',
  standalone: false,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor(
    private router: Router,
    private analyticsService: AnalyticsService,
    private theme: ThemeService   // se instancia y aplica el tema guardado al arrancar
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.analyticsService.trackPageView(event.urlAfterRedirects, document.title);
    });
  }
}
