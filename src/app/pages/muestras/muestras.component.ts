import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { MuestrasService } from '../../core/services/muestras.service';
import { ParcelasService } from '../../core/services/parcelas.service';
import { Muestra } from '../../core/models/muestra.model';
import { Parcela } from '../../core/models/parcela.model';

@Component({
  selector: 'app-muestras',
  templateUrl: './muestras.component.html',
  styleUrls: ['./muestras.component.scss'],
  standalone: false
})
export class MuestrasComponent implements OnInit, OnDestroy {
  muestras: Muestra[] = [];
  parcelas: Parcela[] = [];
  tieneParcelas: boolean | null = null;
  loading = true;
  errorMsg = '';

  // Filtros
  filtroNivel = '';
  filtroParcela = '';          // '' = todas las parcelas

  // Vista
  vistaAgrupada = false;       // false = lista plana, true = agrupada por parcela

  paginaActual = 1;
  pageSize = 10;

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
        this.parcelas = (parcelas as any).data || [];
        this.tieneParcelas = this.parcelas.length > 0;
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

  // ── Filtros ──────────────────────────────────────────────────────────────────

  setFiltro(nivel: string) {
    this.filtroNivel = nivel;
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  setFiltroParcela(parcelaId: string) {
    this.filtroParcela = parcelaId;
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  toggleVista() {
    this.vistaAgrupada = !this.vistaAgrupada;
    this.cdr.detectChanges();
  }

  contarPorNivel(nivel: string): number {
    return this.muestras.filter(m =>
      (m.nivelAfectacion || 'leve') === nivel &&
      (!this.filtroParcela || m.parcelaId === this.filtroParcela)
    ).length;
  }

  contarPorParcela(parcelaId: string): number {
    return this.muestras.filter(m => m.parcelaId === parcelaId).length;
  }

  getNombreParcela(parcelaId: string): string {
    return this.parcelas.find(p => p.id === parcelaId)?.nombre || 'Parcela desconocida';
  }

  // ── Computed ─────────────────────────────────────────────────────────────────

  get muestrasFiltradas(): Muestra[] {
    return this.muestras.filter(m => {
      const nivelOk = !this.filtroNivel || (m.nivelAfectacion || 'leve') === this.filtroNivel;
      const parcelaOk = !this.filtroParcela || m.parcelaId === this.filtroParcela;
      return nivelOk && parcelaOk;
    });
  }

  get muestrasPaginadas(): Muestra[] {
    const size = +this.pageSize;
    const inicio = (this.paginaActual - 1) * size;
    return this.muestrasFiltradas.slice(inicio, inicio + size);
  }

  /** Agrupa las muestras filtradas por parcela */
  get gruposPorParcela(): { parcela: Parcela | null; nombre: string; muestras: Muestra[] }[] {
    const grupos = new Map<string, Muestra[]>();
    for (const m of this.muestrasFiltradas) {
      const pid = m.parcelaId || '_sin_parcela';
      if (!grupos.has(pid)) grupos.set(pid, []);
      grupos.get(pid)!.push(m);
    }
    return Array.from(grupos.entries()).map(([pid, ms]) => ({
      parcela: this.parcelas.find(p => p.id === pid) ?? null,
      nombre: this.parcelas.find(p => p.id === pid)?.nombre ?? 'Sin parcela',
      muestras: ms
    }));
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
