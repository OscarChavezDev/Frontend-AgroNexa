import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

declare const gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser && environment.analyticsId) {
      this.initGtag(environment.analyticsId);
    }
  }

  private initGtag(id: string) {
    // 1. Cargar el script de Google Tag Manager de manera asíncrona
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    // 2. Inicializar la cola global dataLayer y el comando gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function () {
      (window as any).dataLayer.push(arguments);
    };

    // 3. Configurar GA4 con el ID especificado
    gtag('js', new Date());
    gtag('config', id, { send_page_view: false });
  }

  // Registrar vistas de página manuales en la navegación SPA
  trackPageView(pagePath: string, pageTitle: string) {
    if (this.isBrowser && typeof gtag !== 'undefined' && environment.analyticsId) {
      gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle
      });
    }
  }

  // Registrar cualquier otra acción (clics, envíos de formulario, login)
  trackEvent(eventName: string, eventParams: Record<string, any> = {}) {
    if (this.isBrowser && typeof gtag !== 'undefined') {
      gtag('event', eventName, eventParams);
    }
  }
}
