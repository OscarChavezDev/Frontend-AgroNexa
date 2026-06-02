import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { MuestrasService } from '../../core/services/muestras.service';
import { ParcelasService } from '../../core/services/parcelas.service';
import { Muestra } from '../../core/models/muestra.model';

@Component({
  selector: 'app-muestras',
  templateUrl: './muestras.component.html',
  styleUrls: ['./muestras.component.scss'],
  standalone: false
})
export class MuestrasComponent implements OnInit, OnDestroy {
  muestras: Muestra[] = [];
  tieneParcelas: boolean | null = null;
  loading = true;
  errorMsg = '';
  filtroNivel = '';

  paginaActual = 1;
  pageSize = 6;

  private sub?: Subscription;
  private timeout?: ReturnType<typeof setTimeout>;

  constructor(
    private muestrasService: MuestrasService,
    private parcelasService: ParcelasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    clearTimeout(this.timeout);
  }

  cargar() {
    this.loading = true;
    this.errorMsg = '';
    this.sub?.unsubscribe();
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.errorMsg = 'No se pudo conectar con el servidor.';
        this.cdr.detectChanges();
      }
    }, 5000);

    this.sub = forkJoin({
      muestras: this.muestrasService.listar().pipe(catchError(() => of({ data: [] }))),
      parcelas: this.parcelasService.listar().pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: ({ muestras, parcelas }) => {
        clearTimeout(this.timeout);
        this.muestras = ((muestras as any).data || []).sort((a: Muestra, b: Muestra) =>
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        this.tieneParcelas = ((parcelas as any).data || []).length > 0;
        this.paginaActual = 1;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        clearTimeout(this.timeout);
        this.errorMsg = 'Error al cargar datos';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setFiltro(nivel: string) {
    this.filtroNivel = nivel;
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  contarPorNivel(nivel: string): number {
    return this.muestras.filter(m => (m.nivelAfectacion || 'leve') === nivel).length;
  }

  get muestrasFiltradas(): Muestra[] {
    if (!this.filtroNivel) return this.muestras;
    return this.muestras.filter(m => (m.nivelAfectacion || 'leve') === this.filtroNivel);
  }

  get muestrasPaginadas(): Muestra[] {
    const size = +this.pageSize;
    const inicio = (this.paginaActual - 1) * size;
    return this.muestrasFiltradas.slice(inicio, inicio + size);
  }

  get totalPaginas(): number { return Math.ceil(this.muestrasFiltradas.length / +this.pageSize); }
  get rangoInicio(): number { return this.muestrasFiltradas.length === 0 ? 0 : (this.paginaActual - 1) * +this.pageSize + 1; }
  get rangoFin(): number { return Math.min(this.paginaActual * +this.pageSize, this.muestrasFiltradas.length); }

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

  eliminar(id: string) {
    if (!confirm('¿Eliminar esta muestra?')) return;
    this.muestrasService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: () => alert('Error al eliminar')
    });
  }

  nivelClass(nivel: string | undefined): string {
    const map: Record<string, string> = { severo: 'red', moderado: 'amber', leve: 'green' };
    return map[nivel || ''] || 'green';
  }
}
