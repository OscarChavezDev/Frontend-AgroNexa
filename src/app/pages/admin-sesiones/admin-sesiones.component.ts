import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService, ReingresoEntry } from '../../core/services/admin.service';

type Periodo = 'todo' | 'hoy' | 'semana' | 'mes' | 'personalizado';

@Component({
  selector: 'app-admin-sesiones',
  templateUrl: './admin-sesiones.component.html',
  styleUrls: ['./admin-sesiones.component.scss'],
  standalone: false
})
export class AdminSesionesComponent implements OnInit {
  sesiones: ReingresoEntry[] = [];
  loading = true;
  errorMsg = '';
  busqueda = '';

  // Filtros de fecha
  periodoActivo: Periodo = 'todo';
  fechaDesde = '';
  fechaHasta = '';

  paginaActual = 1;
  pageSize = 10;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.errorMsg = '';
    this.adminService.listarSesiones().subscribe({
      next: (res) => {
        this.sesiones = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'Error al cargar datos de sesiones';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Aplica un período rápido y limpia el rango personalizado */
  setPeriodo(p: Periodo) {
    this.periodoActivo = p;
    if (p !== 'personalizado') {
      this.fechaDesde = '';
      this.fechaHasta = '';
    }
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  /** Al tocar cualquier input de fecha → pasa a modo personalizado */
  onFechaChange() {
    this.periodoActivo = 'personalizado';
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  limpiarFiltros() {
    this.periodoActivo = 'todo';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.busqueda = '';
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  get hayFiltrosActivos(): boolean {
    return this.periodoActivo !== 'todo' || !!this.busqueda.trim();
  }

  private get rangoFechas(): { desde: Date | null; hasta: Date | null } {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    switch (this.periodoActivo) {
      case 'hoy':
        return { desde: inicioHoy, hasta: hoy };
      case 'semana': {
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - 6);
        inicio.setHours(0, 0, 0, 0);
        return { desde: inicio, hasta: hoy };
      }
      case 'mes': {
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - 29);
        inicio.setHours(0, 0, 0, 0);
        return { desde: inicio, hasta: hoy };
      }
      case 'personalizado': {
        const desde = this.fechaDesde ? new Date(this.fechaDesde + 'T00:00:00') : null;
        const hasta = this.fechaHasta ? new Date(this.fechaHasta + 'T23:59:59') : null;
        return { desde, hasta };
      }
      default:
        return { desde: null, hasta: null };
    }
  }

  get sesionesFiltradas(): ReingresoEntry[] {
    let lista = [...this.sesiones];

    // Filtro de texto
    if (this.busqueda.trim()) {
      const t = this.busqueda.toLowerCase().trim();
      lista = lista.filter(s =>
        s.nombre.toLowerCase().includes(t) ||
        s.apellido.toLowerCase().includes(t) ||
        s.correo.toLowerCase().includes(t)
      );
    }

    // Filtro de fecha
    const { desde, hasta } = this.rangoFechas;
    if (desde || hasta) {
      lista = lista.filter(s => {
        if (!s.fecha) return false;
        const f = new Date(s.fecha);
        if (desde && f < desde) return false;
        if (hasta && f > hasta) return false;
        return true;
      });
    }

    return lista;
  }

  get sesionesPaginadas(): ReingresoEntry[] {
    const size = +this.pageSize;
    const inicio = (this.paginaActual - 1) * size;
    return this.sesionesFiltradas.slice(inicio, inicio + size);
  }

  get totalPaginas(): number { return Math.ceil(this.sesionesFiltradas.length / +this.pageSize); }
  get rangoInicio(): number { return this.sesionesFiltradas.length === 0 ? 0 : (this.paginaActual - 1) * +this.pageSize + 1; }
  get rangoFin(): number { return Math.min(this.paginaActual * +this.pageSize, this.sesionesFiltradas.length); }

  get paginas(): (number | null)[] {
    const total = this.totalPaginas;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | null)[] = [1];
    const curr = this.paginaActual;
    if (curr > 3) pages.push(null);
    for (let i = Math.max(2, curr - 1); i <= Math.min(total - 1, curr + 1); i++) pages.push(i);
    if (curr < total - 2) pages.push(null);
    pages.push(total);
    return pages;
  }

  cambiarPagina(n: number) {
    if (n < 1 || n > this.totalPaginas) return;
    this.paginaActual = n;
    this.cdr.detectChanges();
  }

  onBusquedaChange() { this.paginaActual = 1; }

  rolLabel(rol: string): string {
    const map: Record<string, string> = {
      productor: 'Productor',
      asociacion: 'Asociación',
      institucion: 'Institución',
      institucional: 'Institución',
    };
    return map[rol] || rol;
  }

  iniciales(s: ReingresoEntry): string {
    return (s.nombre?.[0] || '') + (s.apellido?.[0] || '');
  }

  diasLabel(dias: number | null): string {
    if (dias === null) return '—';
    if (dias < 1)     return 'Mismo día';
    if (dias < 2)     return '1 día';
    return `${Math.round(dias)} días`;
  }

  diasClass(dias: number | null): string {
    if (dias === null) return 'dias-badge--gray';
    if (dias < 1)     return 'dias-badge--gray';   // mismo día: neutro
    if (dias <= 16)   return 'dias-badge--green';
    if (dias <= 25)   return 'dias-badge--amber';
    return 'dias-badge--red';
  }

  get promedioInactividad(): number {
    const validos = this.sesiones.filter(s => s.diasInactivo !== null);
    if (!validos.length) return 0;
    return Math.round(validos.reduce((sum, s) => sum + (s.diasInactivo ?? 0), 0) / validos.length);
  }

  get maxDiasInactivo(): number {
    const validos = this.sesiones.filter(s => s.diasInactivo !== null);
    return validos.length ? Math.max(...validos.map(s => s.diasInactivo ?? 0)) : 0;
  }

  get totalReingresos(): number { return this.sesiones.length; }

  get usuariosUnicos(): number {
    const ids = new Set(this.sesiones.map(s => s.userId));
    return ids.size;
  }

  get ultimoReingreso(): string | null {
    if (!this.sesiones.length) return null;
    return this.sesiones[0].fecha;
  }
}
