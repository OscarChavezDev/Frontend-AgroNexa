import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { AdminService, HistorialEntry } from '../../core/services/admin.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss'],
  standalone: false
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: User[] = [];
  usuariosFiltrados: User[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  procesandoId = '';
  busqueda = '';
  filtroRol = '';
  filtroEstado = '';

  ordenPor: 'createdAt' | '' = 'createdAt';
  ordenDesc = true;

  paginaActual = 1;
  pageSize = 10;

  // Dropdowns custom
  dropdownRolAbierto = false;
  dropdownEstadoAbierto = false;

  // Modal de cambiar estado
  modalAbierto = false;
  usuarioSeleccionado: User | null = null;
  nuevoEstado = '';

  // Modal historial de estado
  historialModalAbierto = false;
  historialUsuario: User | null = null;
  historialEntradas: HistorialEntry[] = [];
  loadingHistorial = false;

  readonly INACTIVIDAD_DIAS = 14;

  readonly roles = [
    { valor: '', etiqueta: 'Todos los roles' },
    { valor: 'productor', etiqueta: 'Productor' },
    { valor: 'asociacion', etiqueta: 'Asociación' },
    { valor: 'institucional', etiqueta: 'Institución' }
  ];

  readonly estados = [
    { valor: '', etiqueta: 'Todos los estados' },
    { valor: 'activo', etiqueta: 'Activo' },
    { valor: 'inactivo', etiqueta: 'Inactivo' },
    { valor: 'suspendido', etiqueta: 'Suspendido' }
  ];

  readonly rolLabels: Record<string, string> = {
    productor: 'Productor',
    asociacion: 'Asociación',
    institucional: 'Institución',
    admin: 'Administrador'
  };

  readonly estadoClasses: Record<string, string> = {
    activo: 'green',
    inactivo: 'amber',
    suspendido: 'red'
  };

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
  }

  // ── Dropdowns ─────────────────────────────────────────────────────────────
  getRolLabel(): string {
    return this.roles.find(r => r.valor === this.filtroRol)?.etiqueta || 'Todos los roles';
  }

  getEstadoLabel(): string {
    return this.estados.find(e => e.valor === this.filtroEstado)?.etiqueta || 'Todos los estados';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.dropdownRolAbierto = false;
      this.dropdownEstadoAbierto = false;
    }
  }

  // ── Carga y filtros ───────────────────────────────────────────────────────
  cargar() {
    this.loading = true;
    const filtros: { rol?: string; estado?: string } = {};
    if (this.filtroRol) filtros.rol = this.filtroRol;
    if (this.filtroEstado) filtros.estado = this.filtroEstado;

    this.adminService.listarUsuarios(filtros).subscribe({
      next: (res) => {
        this.usuarios = (res.data || []).sort((a: User, b: User) =>
          new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
        );
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al cargar usuarios';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros() {
    let resultado = [...this.usuarios];

    if (this.busqueda.trim()) {
      const term = this.busqueda.toLowerCase().trim();
      resultado = resultado.filter(u =>
        u.nombre.toLowerCase().includes(term) ||
        u.apellido.toLowerCase().includes(term) ||
        u.correo.toLowerCase().includes(term)
      );
    }

    // Ordenar
    resultado.sort((a, b) => {
      const va = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const vb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return this.ordenDesc ? vb - va : va - vb;
    });

    this.usuariosFiltrados = resultado;
    this.paginaActual = 1;
  }

  ordenar(campo: 'createdAt') {
    if (this.ordenPor === campo) {
      this.ordenDesc = !this.ordenDesc;
    } else {
      this.ordenPor = campo;
      this.ordenDesc = true;
    }
    this.aplicarFiltros();
  }

  isSortedBy(campo: string): boolean {
    return this.ordenPor === campo;
  }

  getNumero(u: User): number {
    return this.usuarios.indexOf(u) + 1;
  }

  get usuariosPaginados(): User[] {
    const size = +this.pageSize;
    const inicio = (this.paginaActual - 1) * size;
    return this.usuariosFiltrados.slice(inicio, inicio + size);
  }

  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / +this.pageSize);
  }

  get rangoInicio(): number {
    return this.usuariosFiltrados.length === 0 ? 0 : (this.paginaActual - 1) * +this.pageSize + 1;
  }

  get rangoFin(): number {
    return Math.min(this.paginaActual * +this.pageSize, this.usuariosFiltrados.length);
  }

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

  onPageSizeChange() {
    this.pageSize = +this.pageSize;
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  onBusquedaChange() {
    this.aplicarFiltros();
  }

  onFiltroChange() {
    this.cargar();
  }

  // ── Cambiar estado ────────────────────────────────────────────────────────
  abrirModalEstado(usuario: User) {
    this.usuarioSeleccionado = usuario;
    this.nuevoEstado = usuario.estado;
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.usuarioSeleccionado = null;
    this.nuevoEstado = '';
  }

  verHistorial(u: User) {
    this.historialUsuario = u;
    this.historialModalAbierto = true;
    this.historialEntradas = [];
    this.loadingHistorial = true;
    this.cdr.detectChanges();

    this.adminService.historialUsuario(u.id!).subscribe({
      next: (res) => {
        this.historialEntradas = res.data || [];
        this.loadingHistorial = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingHistorial = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarHistorialModal() {
    this.historialModalAbierto = false;
    this.historialUsuario = null;
    this.historialEntradas = [];
  }

  tipoHistorialLabel(tipo: string): string {
    const map: Record<string, string> = {
      inactivado_automatico:   'Inactivado automáticamente',
      reactivado_automatico:   'Reactivado automáticamente',
      activado_manual:         'Activado manualmente',
      inactivado_manual:       'Inactivado manualmente',
      suspendido_manual:       'Suspendido manualmente',
    };
    return map[tipo] || tipo;
  }

  tipoHistorialClass(tipo: string): string {
    if (tipo.includes('inactivado')) return 'historial-chip--inactivo';
    if (tipo.includes('reactivado') || tipo.includes('activado')) return 'historial-chip--activo';
    if (tipo.includes('suspendido')) return 'historial-chip--suspendido';
    return '';
  }

  confirmarCambioEstado() {
    if (!this.usuarioSeleccionado || !this.nuevoEstado) return;
    if (this.nuevoEstado === this.usuarioSeleccionado.estado) {
      this.cerrarModal();
      return;
    }

    this.procesandoId = this.usuarioSeleccionado.id!;
    this.adminService.cambiarEstado(this.usuarioSeleccionado.id!, this.nuevoEstado).subscribe({
      next: () => {
        this.successMsg = `Estado de ${this.usuarioSeleccionado!.nombre} actualizado a "${this.nuevoEstado}"`;
        this.cerrarModal();
        this.procesandoId = '';
        this.cargar();
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al cambiar estado';
        this.procesandoId = '';
        this.cerrarModal();
        setTimeout(() => this.errorMsg = '', 4000);
      }
    });
  }

  // ── Eliminar usuario ──────────────────────────────────────────────────────
  eliminar(usuario: User) {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${usuario.nombre} ${usuario.apellido}"?\n\nEsta acción no se puede deshacer.`)) return;

    this.procesandoId = usuario.id!;
    this.adminService.eliminarUsuario(usuario.id!).subscribe({
      next: () => {
        this.successMsg = `Usuario "${usuario.nombre} ${usuario.apellido}" eliminado correctamente`;
        this.procesandoId = '';
        this.cargar();
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al eliminar usuario';
        this.procesandoId = '';
        setTimeout(() => this.errorMsg = '', 4000);
      }
    });
  }

  get totalFiltrados(): number { return this.usuariosFiltrados.length; }
}