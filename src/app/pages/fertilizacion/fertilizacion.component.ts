import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
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
  MapaSuelo,
  NodoSuelo,
} from '../../core/models/fertilizacion.model';

declare var google: any;

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

  mapa: MapaSuelo | null = null;
  nodoActivo: NodoSuelo | null = null;
  private mapaGoogle: any;
  private nodoMarkers: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fertilizacionService: FertilizacionService,
    private parcelasService: ParcelasService,
    private ngZone: NgZone,
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
        this.cargarMapaSuelo();
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

  // ── Mapa de suelo por nodo ─────────────────────────────────────────────────

  private cargarMapaSuelo() {
    this.fertilizacionService.mapaSuelo(this.parcelaId).subscribe({
      next: (res) => {
        this.mapa = res.data || null;
        this.cdr.detectChanges();
        if (this.mapa?.nodos?.length) {
          setTimeout(() => this.esperarMapsYPintar(), 0);
        }
      },
      error: () => {
        this.mapa = null;
        this.cdr.detectChanges();
      }
    });
  }

  private esperarMapsYPintar(intento = 0) {
    if (typeof google !== 'undefined' && google.maps) {
      this.pintarMapa();
    } else if (intento < 20) {
      setTimeout(() => this.esperarMapsYPintar(intento + 1), 300);
    }
  }

  private pintarMapa() {
    const el = document.getElementById('mapa-suelo');
    if (!el || !this.mapa) return;

    const nodos = this.mapa.nodos;
    if (!nodos.length) return;

    this.mapaGoogle = new google.maps.Map(el, {
      mapTypeId: google.maps.MapTypeId.HYBRID,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    const poligono = this.mapa.parcela.poligono || [];
    if (poligono.length >= 3) {
      new google.maps.Polygon({
        paths: poligono,
        map: this.mapaGoogle,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        fillColor: '#ffffff',
        fillOpacity: 0.08,
      });
    }

    this.nodoMarkers.forEach(m => m.setMap(null));
    this.nodoMarkers.length = 0;

    const bounds = new google.maps.LatLngBounds();

    nodos.forEach((nodo, i) => {
      const marker = new google.maps.Marker({
        position: { lat: nodo.lat, lng: nodo.lng },
        map: this.mapaGoogle,
        title: `${nodo.nombre} — ${nodo.resumen}`,
        label: { text: String(i + 1), color: '#ffffff', fontSize: '11px', fontWeight: '700' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: this.colorNodo(nodo.estado),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        this.ngZone.run(() => {
          this.nodoActivo = nodo;
          this.cdr.detectChanges();
        });
      });

      this.nodoMarkers.push(marker);
      bounds.extend(new google.maps.LatLng(nodo.lat, nodo.lng));
    });

    poligono.forEach(p => bounds.extend(new google.maps.LatLng(p.lat, p.lng)));
    this.mapaGoogle.fitBounds(bounds);

    // Con un solo nodo fitBounds acerca demasiado y se pierde la referencia.
    if (nodos.length === 1 && !poligono.length) {
      google.maps.event.addListenerOnce(this.mapaGoogle, 'idle', () => {
        this.mapaGoogle.setZoom(17);
      });
    }
  }

  colorNodo(estado: string): string {
    const map: Record<string, string> = {
      critico: '#ef4444',
      atencion: '#f59e0b',
      bueno: '#22c55e',
      sin_datos: '#94a3b8',
    };
    return map[estado] || '#94a3b8';
  }

  estadoNodoClass(estado: string): string {
    const map: Record<string, string> = {
      critico: 'red',
      atencion: 'amber',
      bueno: 'green',
      sin_datos: 'gray',
    };
    return map[estado] || 'gray';
  }

  estadoNodoTexto(estado: string): string {
    const map: Record<string, string> = {
      critico: 'Requiere atención',
      atencion: 'Vigilar',
      bueno: 'Bien',
      sin_datos: 'Sin muestras',
    };
    return map[estado] || estado;
  }

  seleccionarNodo(nodo: NodoSuelo) {
    this.nodoActivo = this.nodoActivo?.id === nodo.id ? null : nodo;
    if (this.nodoActivo && this.mapaGoogle) {
      this.mapaGoogle.panTo({ lat: nodo.lat, lng: nodo.lng });
    }
  }

  get tieneNodos(): boolean {
    return !!this.mapa?.nodos?.length;
  }

  verMuestra(id?: string) {
    if (id) this.router.navigate(['/muestras', id]);
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
