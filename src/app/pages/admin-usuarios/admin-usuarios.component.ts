import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';
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

  // Modal de cambiar estado
  modalAbierto = false;
  usuarioSeleccionado: User | null = null;
  nuevoEstado = '';

  readonly roles = [
    { valor: '', etiqueta: 'Todos los roles' },
    { valor: 'productor', etiqueta: 'Productor' },
    { valor: 'asociacion', etiqueta: 'Asociación' },
    { valor: 'institucion', etiqueta: 'Institución' }
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
    institucion: 'Institución',
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

  cargar() {
    this.loading = true;
    const filtros: { rol?: string; estado?: string } = {};
    if (this.filtroRol) filtros.rol = this.filtroRol;
    if (this.filtroEstado) filtros.estado = this.filtroEstado;

    this.adminService.listarUsuarios(filtros).subscribe({
      next: (res) => {
        this.usuarios = res.data || [];
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
    this.usuariosFiltrados = resultado;
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

  get totalFiltrados(): number {
    return this.usuariosFiltrados.length;
  }
}
