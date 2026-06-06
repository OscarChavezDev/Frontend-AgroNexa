import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Mensaje, MensajesService } from '../../core/services/mensajes.service';

@Component({
  selector: 'app-admin-recomendaciones',
  templateUrl: './admin-recomendaciones.component.html',
  styleUrls: ['./admin-recomendaciones.component.scss'],
  standalone: false
})
export class AdminRecomendacionesComponent implements OnInit {
  mensajes: Mensaje[] = [];
  loading = true;
  errorMsg = '';
  busqueda = '';
  soloPendientes = false;
  paginaActual = 1;
  pageSize = 10;

  constructor(
    private mensajesService: MensajesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.errorMsg = '';

    this.mensajesService.listar().subscribe({
      next: (res) => {
        this.mensajes = (res.data || []).filter(m => m.tipo === 'feedback');
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar las recomendaciones.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  marcarComoLeido(mensaje: Mensaje, event?: Event) {
    event?.stopPropagation();
    if (mensaje.leido) return;

    this.mensajesService.marcarLeido(mensaje.id).subscribe({
      next: () => {
        mensaje.leido = true;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  togglePendientes() {
    this.soloPendientes = !this.soloPendientes;
    this.paginaActual = 1;
  }

  onBusquedaChange() {
    this.paginaActual = 1;
  }

  onPageSizeChange() {
    this.pageSize = +this.pageSize;   // el <select> devuelve string; lo pasamos a número
    this.paginaActual = 1;
  }

  get recomendacionesFiltradas(): Mensaje[] {
    let lista = [...this.mensajes];

    if (this.soloPendientes) {
      lista = lista.filter(m => !m.leido);
    }

    const texto = this.busqueda.trim().toLowerCase();
    if (texto) {
      lista = lista.filter(m =>
        `${m.nombre} ${m.apellido}`.toLowerCase().includes(texto) ||
        m.correo.toLowerCase().includes(texto) ||
        m.mensaje.toLowerCase().includes(texto)
      );
    }

    return lista;
  }

  get recomendacionesPaginadas(): Mensaje[] {
    const inicio = (this.paginaActual - 1) * this.pageSize;
    return this.recomendacionesFiltradas.slice(inicio, inicio + this.pageSize);
  }

  get totalPaginas(): number {
    return Math.ceil(this.recomendacionesFiltradas.length / this.pageSize);
  }

  get rangoInicio(): number {
    return this.recomendacionesFiltradas.length === 0 ? 0 : (this.paginaActual - 1) * this.pageSize + 1;
  }

  get rangoFin(): number {
    return Math.min(this.paginaActual * this.pageSize, this.recomendacionesFiltradas.length);
  }

  get totalPendientes(): number {
    return this.mensajes.filter(m => !m.leido).length;
  }

  get recomendacionesHoy(): number {
    const hoy = new Date();
    return this.mensajes.filter(m => {
      const fecha = new Date(m.createdAt);
      return fecha.getFullYear() === hoy.getFullYear()
        && fecha.getMonth() === hoy.getMonth()
        && fecha.getDate() === hoy.getDate();
    }).length;
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
  }

  iniciales(mensaje: Mensaje): string {
    return `${mensaje.nombre?.[0] || ''}${mensaje.apellido?.[0] || ''}`;
  }
}
