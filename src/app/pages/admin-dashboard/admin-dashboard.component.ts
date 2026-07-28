import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService, AdminStats, ReingresoEntry, ActividadTemporal } from '../../core/services/admin.service';
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
  reingresos: ReingresoEntry[] = [];
  actividad: ActividadTemporal | null = null;
  loading = true;
  loadingRanking = true;
  loadingActividad = true;
  rankingExpandido = false;
  readonly RANKING_VISIBLE = 5;
  errorMsg = '';

  get totalUsuariosVolvieron(): number {
    return new Set(this.reingresos.map(r => r.userId)).size;
  }

  readonly MAX_DIAS_INACTIVO_TOPE = 23;

  get maxDiasInactivo(): number {
    const vals = this.reingresos
      .map(r => r.diasInactivo)
      .filter((d): d is number => d !== null);
    if (!vals.length) return 0;
    return Math.min(Math.round(Math.max(...vals)), this.MAX_DIAS_INACTIVO_TOPE);
  }

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
    this.cargarRanking();
    this.cargarReingresos();
    this.cargarActividad();
  }

  cargarReingresos() {
    this.adminService.listarSesiones().subscribe({
      next: (res) => { this.reingresos = res.data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  cargarActividad() {
    this.loadingActividad = true;
    this.adminService.obtenerActividadTemporal().subscribe({
      next: (res) => {
        this.actividad = res.data || null;
        this.loadingActividad = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingActividad = false; this.cdr.detectChanges(); }
    });
  }

  periodoRegistros: '7' | '30' | '90' = '30';

  get registrosFiltrados(): { fecha: string; count: number; label: string }[] {
    if (!this.actividad?.registros) return [];
    const dias = parseInt(this.periodoRegistros);
    const serie = this.actividad.registros.slice(-dias);
    return serie.map((r, i) => ({
      ...r,
      label: this.labelFecha(r.fecha, dias, i, serie.length)
    }));
  }

  labelFecha(fecha: string, totalDias: number, idx: number, total: number): string {
    const d = new Date(fecha + 'T00:00:00');
    const dia  = String(d.getDate()).padStart(2, '0');
    const mes  = String(d.getMonth() + 1).padStart(2, '0');
    if (totalDias <= 7)  return `${dia}/${mes}`;
    if (totalDias <= 30) return idx % 5  === 0 ? `${dia}/${mes}` : '';
    return idx % 15 === 0 ? `${dia}/${mes}` : '';
  }

  maxRegistros(): number {
    const vals = this.registrosFiltrados.map(r => r.count);
    return Math.max(...vals, 1);
  }

  alturaBar(count: number): number {
    return Math.round((count / this.maxRegistros()) * 100);
  }

  get totalRegistrosPeriodo(): number {
    return this.registrosFiltrados.reduce((s, r) => s + r.count, 0);
  }

  maxDia(): number {
    if (!this.actividad?.porDia?.length) return 1;
    return Math.max(...this.actividad.porDia.map(d => d.count), 1);
  }

  maxMes(): number {
    if (!this.actividad?.porMes?.length) return 1;
    return Math.max(...this.actividad.porMes.map(m => m.count), 1);
  }

  barDia(count: number): number { return Math.round((count / this.maxDia()) * 100); }
  barMes(count: number): number { return Math.round((count / this.maxMes()) * 100); }

  diaMasActivo(): string {
    if (!this.actividad?.porDia?.length) return '—';
    return [...this.actividad.porDia].sort((a, b) => b.count - a.count)[0].dia;
  }

  mesMasActivo(): string {
    if (!this.actividad?.porMes?.length) return '—';
    return [...this.actividad.porMes].sort((a, b) => b.count - a.count)[0].mes;
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

  topVisitas:  User[] = [];
  topMuestras: User[] = [];

  cargarRanking() {
    this.loadingRanking = true;
    this.adminService.listarUsuarios().subscribe({
      next: (res) => {
        const usuarios = (res.data || []).filter((u: User) => u.rol !== 'admin');
        this.topVisitas  = [...usuarios]
          .sort((a, b) => (b.loginCount || 0) - (a.loginCount || 0))
          .slice(0, 5);
        this.topMuestras = [...usuarios]
          .sort((a, b) => (b.totalMuestras || 0) - (a.totalMuestras || 0))
          .slice(0, 5);
        this.rankingUsuarios = this.topVisitas; // backwards compat
        this.loadingRanking = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingRanking = false;
        this.cdr.detectChanges();
      }
    });
  }

  maxVisitas():  number { return Math.max(...this.topVisitas.map(u => u.loginCount || 0), 1); }
  maxMuestras(): number { return Math.max(...this.topMuestras.map(u => u.totalMuestras || 0), 1); }

  barVisitas(u: User):  number { return Math.round(((u.loginCount || 0)    / this.maxVisitas())  * 100); }
  barMuestras(u: User): number { return Math.round(((u.totalMuestras || 0) / this.maxMuestras()) * 100); }

  iniciales(u: User): string { return (u.nombre?.[0] || '') + (u.apellido?.[0] || ''); }

  medalClass(pos: number): string {
    return pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
  }

  // legacy — mantiene compatibilidad con getters existentes
  scoreUsuario(u: User): number { return (u.loginCount || 0); }
  get maxScore(): number { return this.maxVisitas(); }
  barWidth(u: User): number { return this.barVisitas(u); }
  get rankingVisible(): User[] { return this.topVisitas.slice(0, this.RANKING_VISIBLE); }
  toggleRanking() {}

  get porcentajeActivos(): number {
    if (!this.stats || this.stats.usuarios.total === 0) return 0;
    return Math.round((this.stats.usuarios.activos / this.stats.usuarios.total) * 100);
  }
}
