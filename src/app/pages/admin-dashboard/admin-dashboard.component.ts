import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService, AdminStats } from '../../core/services/admin.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  rankingUsuarios: User[] = [];
  loading = true;
  loadingRanking = true;
  rankingExpandido = false;
  readonly RANKING_VISIBLE = 5;
  errorMsg = '';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
    this.cargarRanking();
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

  cargarRanking() {
    this.loadingRanking = true;
    this.adminService.listarUsuarios().subscribe({
      next: (res) => {
        const usuarios = (res.data || []).filter((u: User) => u.rol !== 'admin');
        this.rankingUsuarios = usuarios
          .sort((a: User, b: User) => this.scoreUsuario(b) - this.scoreUsuario(a))
          .slice(0, 10);
        this.loadingRanking = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingRanking = false;
        this.cdr.detectChanges();
      }
    });
  }

  scoreUsuario(u: User): number {
    return (u.loginCount || 0) * 2
      + (u.totalDiagnosticos || 0) * 3
      + (u.totalMuestras || 0) * 2
      + (u.totalParcelas || 0);
  }

  get maxScore(): number {
    return Math.max(...this.rankingUsuarios.map(u => this.scoreUsuario(u)), 1);
  }

  barWidth(u: User): number {
    return Math.round((this.scoreUsuario(u) / this.maxScore) * 100);
  }

  medalClass(pos: number): string {
    return pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
  }

  get rankingVisible(): User[] {
    return this.rankingExpandido
      ? this.rankingUsuarios
      : this.rankingUsuarios.slice(0, this.RANKING_VISIBLE);
  }

  toggleRanking() { this.rankingExpandido = !this.rankingExpandido; }

  get porcentajeActivos(): number {
    if (!this.stats || this.stats.usuarios.total === 0) return 0;
    return Math.round((this.stats.usuarios.activos / this.stats.usuarios.total) * 100);
  }
}
