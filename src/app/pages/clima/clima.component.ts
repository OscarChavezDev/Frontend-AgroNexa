import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClimaService } from '../../core/services/clima.service';
import { ParcelasService } from '../../core/services/parcelas.service';
import { Parcela } from '../../core/models/parcela.model';
import { Clima, DiaPronostico } from '../../core/models/clima.model';

@Component({
  selector: 'app-clima',
  templateUrl: './clima.component.html',
  styleUrls: ['./clima.component.scss'],
  standalone: false
})
export class ClimaComponent implements OnInit {
  parcelaId = '';
  nombreParcela = '';
  clima: Clima | null = null;

  /** Sin parcela en la ruta la pantalla actúa como selector: lista las parcelas. */
  modoSeleccion = false;
  parcelas: Parcela[] = [];

  loading = true;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private climaService: ClimaService,
    private parcelasService: ParcelasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.modoSeleccion = false;
        this.parcelaId = id;
        this.cargarClima();
      } else {
        this.modoSeleccion = true;
        this.cargarParcelas();
      }
    });
  }

  private cargarParcelas() {
    this.loading = true;
    this.cdr.detectChanges();

    this.parcelasService.listar().subscribe({
      next: (res) => {
        this.parcelas = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'No se pudieron cargar las parcelas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cargarClima() {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.climaService.porParcela(this.parcelaId).subscribe({
      next: (res) => {
        this.clima = res.data || null;
        this.nombreParcela = this.clima?.parcela?.nombre || '';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'No se pudo obtener el clima de esta parcela';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirParcela(id?: string) {
    if (id) this.router.navigate(['/parcelas', id, 'clima']);
  }

  volverAParcela() {
    this.router.navigate(['/parcelas', this.parcelaId]);
  }

  irAFertilizacion() {
    this.router.navigate(['/parcelas', this.parcelaId, 'fertilizacion']);
  }

  recargar() {
    this.cargarClima();
  }

  // ── Datos derivados ────────────────────────────────────────────────────────

  get pronostico(): DiaPronostico[] {
    return this.clima?.pronostico || [];
  }

  /** Escala las barras de lluvia contra el día más lluvioso de la semana. */
  alturaBarra(dia: DiaPronostico): number {
    const maximo = Math.max(...this.pronostico.map(d => d.precipitacionMm || 0), 1);
    return Math.round(((dia.precipitacionMm || 0) / maximo) * 100);
  }

  intensidadClass(mm: number): string {
    if (mm >= 25) return 'fuerte';
    if (mm >= 5) return 'moderada';
    if (mm > 0) return 'ligera';
    return 'seco';
  }

  intensidadTexto(mm: number): string {
    if (mm >= 25) return 'Lluvia fuerte';
    if (mm >= 5) return 'Lluvia moderada';
    if (mm > 0) return 'Lluvia ligera';
    return 'Sin lluvia';
  }

  /**
   * 1 mm de lluvia = 1 litro por m² = 10 000 litros por hectárea.
   * Se muestra en litros por hectárea porque es la unidad con la que el
   * productor dimensiona el agua que realmente cae en su parcela.
   */
  litrosPorHectarea(mm: number): string {
    const litros = (mm || 0) * 10000;
    if (litros >= 1000000) return `${(litros / 1000000).toFixed(1)} millones de litros por hectárea`;
    if (litros >= 1000) return `${Math.round(litros / 1000)} mil litros por hectárea`;
    return `${Math.round(litros)} litros por hectárea`;
  }
}
