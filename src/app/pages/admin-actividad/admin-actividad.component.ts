import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-actividad',
  templateUrl: './admin-actividad.component.html',
  styleUrls: ['./admin-actividad.component.scss'],
  standalone: false
})
export class AdminActividadComponent implements OnInit {
  usuarios: User[] = [];
  loading = true;
  errorMsg = '';
  busqueda = '';
  ordenPor: 'loginCount' | 'lastLogin' | 'totalParcelas' | 'totalMuestras' | 'totalDiagnosticos' = 'loginCount';
  ordenDesc = true;

  paginaActual = 1;
  pageSize = 10;

  // Modal detalle de parcelas
  modalAbierto = false;
  usuarioSeleccionado: User | null = null;
  parcelasDetalle: any[] = [];
  loadingParcelas = false;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.adminService.listarUsuarios().subscribe({
      next: (res) => {
        this.usuarios = (res.data || []).filter((u: User) => u.rol !== 'admin');
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'Error al cargar datos de actividad';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  verDetalle(u: User) {
    this.usuarioSeleccionado = u;
    this.modalAbierto = true;
    this.parcelasDetalle = [];
    this.loadingParcelas = true;
    this.cdr.detectChanges();

    this.adminService.parcelasUsuario(u.id!).subscribe({
      next: (res) => {
        this.parcelasDetalle = res.data || [];
        this.loadingParcelas = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingParcelas = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.usuarioSeleccionado = null;
    this.parcelasDetalle = [];
  }

  get usuariosFiltrados(): User[] {
    let lista = [...this.usuarios];
    if (this.busqueda.trim()) {
      const t = this.busqueda.toLowerCase().trim();
      lista = lista.filter(u =>
        u.nombre.toLowerCase().includes(t) ||
        u.apellido.toLowerCase().includes(t) ||
        u.correo.toLowerCase().includes(t)
      );
    }
    lista.sort((a, b) => {
      let va: number, vb: number;
      if (this.ordenPor === 'lastLogin') {
        va = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        vb = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
      } else {
        va = (a as any)[this.ordenPor] ?? 0;
        vb = (b as any)[this.ordenPor] ?? 0;
      }
      return this.ordenDesc ? vb - va : va - vb;
    });
    return lista;
  }

  get usuariosPaginados(): User[] {
    const size = +this.pageSize;
    const inicio = (this.paginaActual - 1) * size;
    return this.usuariosFiltrados.slice(inicio, inicio + size);
  }

  get totalPaginas(): number { return Math.ceil(this.usuariosFiltrados.length / +this.pageSize); }
  get rangoInicio(): number { return this.usuariosFiltrados.length === 0 ? 0 : (this.paginaActual - 1) * +this.pageSize + 1; }
  get rangoFin(): number { return Math.min(this.paginaActual * +this.pageSize, this.usuariosFiltrados.length); }

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

  ordenar(campo: typeof this.ordenPor) {
    if (this.ordenPor === campo) {
      this.ordenDesc = !this.ordenDesc;
    } else {
      this.ordenPor = campo;
      this.ordenDesc = true;
    }
    this.paginaActual = 1;
  }

  onBusquedaChange() { this.paginaActual = 1; }

  get totalVisitas(): number { return this.usuarios.reduce((s, u) => s + (u.loginCount || 0), 0); }
  get usuariosQueUsaron(): number { return this.usuarios.filter(u => (u.loginCount || 0) > 0).length; }
  get promedioVisitas(): string {
    if (!this.usuariosQueUsaron) return '0';
    return (this.totalVisitas / this.usuariosQueUsaron).toFixed(1);
  }
  get usuarioMasActivo(): User | null {
    return this.usuarios.reduce((max: User | null, u) =>
      !max || (u.loginCount || 0) > (max.loginCount || 0) ? u : max, null);
  }

  isSortedBy(campo: string): boolean { return this.ordenPor === campo; }
}
