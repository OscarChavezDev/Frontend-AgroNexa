import { NgModule, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Sin esto el pipe `date` usa en-US y los días salen en inglés ("Monday").
registerLocaleData(localeEsPe, 'es-PE');

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Layout
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

// Pages
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ParcelasComponent } from './pages/parcelas/parcelas.component';
import { ParcelaFormComponent } from './pages/parcela-form/parcela-form.component';
import { ParcelaDetailComponent } from './pages/parcela-detail/parcela-detail.component';
import { MuestrasComponent } from './pages/muestras/muestras.component';
import { MuestraFormComponent } from './pages/muestra-form/muestra-form.component';
import { MuestraDetailComponent } from './pages/muestra-detail/muestra-detail.component';
import { DiagnosticoIaComponent } from './pages/diagnostico-ia/diagnostico-ia.component';
import { FertilizacionComponent } from './pages/fertilizacion/fertilizacion.component';
import { ClimaComponent } from './pages/clima/clima.component';
import { PlanesComponent } from './pages/planes/planes.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsuariosComponent } from './pages/admin-usuarios/admin-usuarios.component';
import { AdminActividadComponent } from './pages/admin-actividad/admin-actividad.component';
import { AdminSesionesComponent } from './pages/admin-sesiones/admin-sesiones.component';
import { AdminRecomendacionesComponent } from './pages/admin-recomendaciones/admin-recomendaciones.component';
import { LandingComponent } from './pages/landing/landing.component';
import { OnboardingOverlayComponent } from './shared/onboarding/onboarding-overlay.component';
import { NotificacionesComponent } from './shared/notificaciones/notificaciones.component';
import { PopupComponent } from './shared/components/popup/popup.component';

@NgModule({
  declarations: [
    App,
    MainLayoutComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    ParcelasComponent,
    ParcelaFormComponent,
    ParcelaDetailComponent,
    MuestrasComponent,
    MuestraFormComponent,
    MuestraDetailComponent,
    DiagnosticoIaComponent,
    FertilizacionComponent,
    ClimaComponent,
    PlanesComponent,
    PerfilComponent,
    AdminDashboardComponent,
    AdminUsuariosComponent,
    AdminActividadComponent,
    AdminSesionesComponent,
    AdminRecomendacionesComponent,
    LandingComponent,
    OnboardingOverlayComponent,
    NotificacionesComponent,
    PopupComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es-PE' },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [App]
})
export class AppModule { }
