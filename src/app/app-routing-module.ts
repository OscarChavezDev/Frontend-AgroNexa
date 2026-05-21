import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ParcelasComponent } from './pages/parcelas/parcelas.component';
import { ParcelaFormComponent } from './pages/parcela-form/parcela-form.component';
import { ParcelaDetailComponent } from './pages/parcela-detail/parcela-detail.component';
import { MuestrasComponent } from './pages/muestras/muestras.component';
import { MuestraFormComponent } from './pages/muestra-form/muestra-form.component';
import { MuestraDetailComponent } from './pages/muestra-detail/muestra-detail.component';
import { PlanesComponent } from './pages/planes/planes.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsuariosComponent } from './pages/admin-usuarios/admin-usuarios.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [NoAuthGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [NoAuthGuard] },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'parcelas', component: ParcelasComponent },
      { path: 'parcelas/nueva', component: ParcelaFormComponent },
      { path: 'parcelas/:id', component: ParcelaDetailComponent },
      { path: 'parcelas/:id/editar', component: ParcelaFormComponent },
      { path: 'muestras', component: MuestrasComponent },
      { path: 'muestras/nueva', component: MuestraFormComponent },
      { path: 'muestras/:id', component: MuestraDetailComponent },
      { path: 'planes', component: PlanesComponent },
      { path: 'perfil', component: PerfilComponent },
      { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard] },
      { path: 'admin/usuarios', component: AdminUsuariosComponent, canActivate: [AdminGuard] },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
