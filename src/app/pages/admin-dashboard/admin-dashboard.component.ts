import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService, AdminStats } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  loading = true;
  errorMsg = '';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.adminService.obtenerEstadisticas().subscribe({
      next: (res) => {
        this.stats = res.data || null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al obtener estadísticas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get porcentajeActivos(): number {
    if (!this.stats || this.stats.usuarios.total === 0) return 0;
    return Math.round((this.stats.usuarios.activos / this.stats.usuarios.total) * 100);
  }
}
