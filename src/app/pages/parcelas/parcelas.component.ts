import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { getCultivoOption } from '../../core/constants/cultivos';
import { Muestra } from '../../core/models/muestra.model';
import { Parcela } from '../../core/models/parcela.model';
import { MuestrasService } from '../../core/services/muestras.service';
import { ParcelasService } from '../../core/services/parcelas.service';

@Component({
  selector: 'app-parcelas',
  templateUrl: './parcelas.component.html',
  styleUrls: ['./parcelas.component.scss'],
  standalone: false
})
export class ParcelasComponent implements OnInit, OnDestroy {
  parcelas: Parcela[] = [];
  loading = true;
  errorMsg = '';
  muestrasPorParcela: Record<string, number> = {};

  private sub?: Subscription;
  private timeout?: ReturnType<typeof setTimeout>;

  constructor(
    private parcelasService: ParcelasService,
    private muestrasService: MuestrasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
  }

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
        this.errorMsg = 'No se pudo conectar con el servidor (tiempo de espera agotado).';
        this.cdr.detectChanges();
      }
    }, 5000);

    this.sub = forkJoin({
      parcelas: this.parcelasService.listar(),
      muestras: this.muestrasService.listar()
    }).subscribe({
      next: ({ parcelas, muestras }) => {
        clearTimeout(this.timeout);
        this.parcelas = parcelas.data || [];
        this.muestrasPorParcela = this.buildMuestrasMap(muestras.data || []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        clearTimeout(this.timeout);
        console.error('Error al obtener parcelas:', error);
        this.errorMsg = 'Error al cargar parcelas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(id: string, nombre: string) {
    if (!confirm(`Eliminar la parcela "${nombre}"?`)) return;
    this.parcelasService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: () => alert('Error al eliminar')
    });
  }

  getCultivoMeta(cultivo?: string | null) {
    return getCultivoOption(cultivo);
  }

  getMuestrasCount(parcelaId?: string): number {
    if (!parcelaId) return 0;
    return this.muestrasPorParcela[parcelaId] || 0;
  }

  formatArea(parcela: Parcela): string {
    const area = Number(parcela.areaAproximada);

    if (!Number.isFinite(area) || area <= 0) {
      return '';
    }

    return `${area} ${parcela.unidadArea || ''}`.trim();
  }

  formatReferencia(parcela: Parcela): string {
    return parcela.referencia || '';
  }

  formatVariedad(parcela: Parcela): string {
    return parcela.variedad || '';
  }

  formatSistema(parcela: Parcela): string {
    return parcela.sistemaCultivo ? this.toTitle(parcela.sistemaCultivo) : '';
  }

  private buildMuestrasMap(muestras: Muestra[]): Record<string, number> {
    return muestras.reduce<Record<string, number>>((acc, muestra) => {
      if (!muestra.parcelaId) return acc;
      acc[muestra.parcelaId] = (acc[muestra.parcelaId] || 0) + 1;
      return acc;
    }, {});
  }

  private toTitle(value: string): string {
    return value
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
}
