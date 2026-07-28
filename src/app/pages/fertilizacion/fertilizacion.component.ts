import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FertilizacionService } from '../../core/services/fertilizacion.service';
import { ParcelasService } from '../../core/services/parcelas.service';
import { Parcela } from '../../core/models/parcela.model';
import {
  FertilizacionPreview,
  FertilizacionResponse,
  ItemFertilizante,
  LecturaSuelo,
  PlanFertilizacion,
  VentanaAplicacion,
} from '../../core/models/fertilizacion.model';

interface FilaSuelo {
  clave: string;
  etiqueta: string;
  lectura: LecturaSuelo;
}

@Component({
  selector: 'app-fertilizacion',
  templateUrl: './fertilizacion.component.html',
  styleUrls: ['./fertilizacion.component.scss'],
  standalone: false
})
export class FertilizacionComponent implements OnInit {
  parcelaId = '';
  preview: FertilizacionPreview | null = null;
  resultado: FertilizacionResponse | null = null;

  /** Sin parcela en la ruta la pantalla actúa como selector: lista las parcelas. */
  modoSeleccion = false;
  parcelas: Parcela[] = [];

  loading = true;
  generando = false;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fertilizacionService: FertilizacionService,
    private parcelasService: ParcelasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.modoSeleccion = false;
        this.parcelaId = id;
        this.cargar();
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

  abrirParcela(id?: string) {
    if (id) this.router.navigate(['/parcelas', id, 'fertilizacion']);
  }

  cargar() {
    this.loading = true;
    this.cdr.detectChanges();

    // El preview pinta suelo y clima de inmediato; el plan guardado llega después.
    this.fertilizacionService.preview(this.parcelaId).subscribe({
      next: (res) => {
        this.preview = res.data || null;
        this.loading = false;
        this.cdr.detectChanges();
        this.cargarUltimoPlan();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'No se pudo cargar la información de la parcela';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cargarUltimoPlan() {
    this.fertilizacionService.ultimo(this.parcelaId).subscribe({
      next: (res) => {
        const data = res.data as any;
        this.resultado = data && data.plan ? data : null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.resultado = null;
        this.cdr.detectChanges();
      }
    });
  }

  generarPlan() {
    this.generando = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.fertilizacionService.generar(this.parcelaId).subscribe({
      next: (res) => {
        this.resultado = res.data || null;
        this.generando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'No se pudo generar el plan de fertilización';
        this.generando = false;
        this.cdr.detectChanges();
      }
    });
  }

  volverAParcela() {
    this.router.navigate(['/parcelas', this.parcelaId]);
  }


  // ── Datos derivados ────────────────────────────────────────────────────────

  get plan(): PlanFertilizacion | null {
    return this.resultado?.plan || null;
  }

  get nombreParcela(): string {
    return this.resultado?.parcela?.nombre || this.preview?.parcela?.nombre || '';
  }

  /** La ventana del plan si ya existe; si no, la del preview. */
  get ventana(): VentanaAplicacion | null {
    return this.plan?.ventanaAplicacion || this.preview?.ventanaAplicacion || null;
  }

  get tieneMuestra(): boolean {
    return this.preview?.tieneMuestra ?? false;
  }

  get fechaMuestra(): string | undefined {
    return this.resultado?.muestraUsada?.fecha || this.preview?.muestraUsada?.fecha;
  }

  get fechaGeneracion(): string | undefined {
    return this.resultado?.fecha_generacion;
  }

  get esFuenteIA(): boolean {
    return this.resultado?.fuente === 'ia';
  }

  get filasSuelo(): FilaSuelo[] {
    const suelo = this.plan?.suelo || this.preview?.suelo;
    if (!suelo) return [];

    const etiquetas: Record<string, string> = {
      ph: 'pH',
      nitrogeno: 'Nitrógeno (N)',
      fosforo: 'Fósforo (P)',
      potasio: 'Potasio (K)',
      conductividadElectrica: 'Conductividad eléctrica',
      humedadSuelo: 'Humedad del suelo',
    };

    return Object.keys(etiquetas)
      .map(clave => ({
        clave,
        etiqueta: etiquetas[clave],
        lectura: (suelo as any)[clave] as LecturaSuelo,
      }))
      .filter(fila => !!fila.lectura);
  }

  /** Corrección de pH primero: sin el pH corregido, el resto del plan rinde menos. */
  get itemsPlan(): ItemFertilizante[] {
    if (!this.plan) return [];
    const items: ItemFertilizante[] = [];
    if (this.plan.correccionPh) items.push(this.plan.correccionPh);
    items.push(...(this.plan.fertilizantes || []));
    return items;
  }

  // ── Helpers de presentación ────────────────────────────────────────────────

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      bajo: 'red', muy_acido: 'red', muy_alcalino: 'red', salino: 'red', saturado: 'red', seco: 'red',
      medio: 'amber', acido: 'amber', alcalino: 'amber', elevado: 'amber',
      alto: 'green', optimo: 'green', adecuado: 'green',
      sin_dato: 'gray',
    };
    return map[estado] || 'gray';
  }

  estadoTexto(estado: string): string {
    const map: Record<string, string> = {
      bajo: 'Bajo', medio: 'Medio', alto: 'Alto',
      optimo: 'Óptimo', acido: 'Ácido', muy_acido: 'Muy ácido',
      alcalino: 'Alcalino', muy_alcalino: 'Muy alcalino',
      elevado: 'Elevado', salino: 'Salino',
      seco: 'Seco', adecuado: 'Adecuado', saturado: 'Saturado',
      sin_dato: 'Sin dato',
    };
    return map[estado] || estado;
  }

  prioridadClass(prioridad?: string): string {
    const map: Record<string, string> = { alta: 'red', media: 'amber', baja: 'green' };
    return map[prioridad || ''] || 'gray';
  }

  get ventanaClass(): string {
    const estado = this.ventana?.estado;
    if (estado === 'ideal') return 'ok';
    if (estado === 'aceptable') return 'warn';
    if (estado === 'sin_datos') return 'neutral';
    return 'stop';
  }

  get ventanaTitulo(): string {
    const map: Record<string, string> = {
      ideal: 'Momento ideal para fertilizar',
      aceptable: 'Se puede fertilizar',
      lluvia_excesiva: 'No fertilizar ahora',
      muy_seco: 'Conviene esperar',
      sin_datos: 'Clima no disponible',
    };
    return map[this.ventana?.estado || ''] || 'Ventana de aplicación';
  }

}
