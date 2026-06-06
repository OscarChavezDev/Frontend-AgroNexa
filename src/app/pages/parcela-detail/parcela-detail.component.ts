import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ParcelasService } from '../../core/services/parcelas.service';
import { MuestrasService } from '../../core/services/muestras.service';
import { Parcela } from '../../core/models/parcela.model';
import { Muestra } from '../../core/models/muestra.model';

declare var google: any;

@Component({
  selector: 'app-parcela-detail',
  templateUrl: './parcela-detail.component.html',
  styleUrls: ['./parcela-detail.component.scss'],
  standalone: false
})
export class ParcelaDetailComponent implements OnInit {
  parcela: Parcela | null = null;
  muestras: Muestra[] = [];
  loading = true;
  errorMsg = '';
  parcelaId = '';

  private mapInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private parcelasService: ParcelasService,
    private muestrasService: MuestrasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.parcelaId = id;
        this.cargar();
      } else {
        this.errorMsg = 'ID de parcela no válido';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargar() {
    this.loading = true;
    this.cdr.detectChanges();
    this.parcelasService.obtener(this.parcelaId).subscribe({
      next: (res) => {
        try {
          this.parcela = res.data || null;
          this.loading = false;
          this.cargarMuestras();
          if (this.parcela?.ubicacion) {
            setTimeout(() => this.waitForMapsAndInit(), 0);
          }
        } catch (e) {
          console.error('Error in ParcelaDetail obtener next:', e);
          this.errorMsg = 'Error al procesar datos de la parcela';
          this.loading = false;
        } finally {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching Parcela:', err);
        this.errorMsg = 'Error al cargar la parcela';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private waitForMapsAndInit(attempt = 0) {
    if (typeof google !== 'undefined' && google.maps) {
      this.initMiniMap();
    } else if (attempt < 20) {
      setTimeout(() => this.waitForMapsAndInit(attempt + 1), 300);
    }
  }

  private initMiniMap() {
    if (this.mapInitialized || !this.parcela?.ubicacion) return;
    const mapEl = document.getElementById('parcela-mini-map');
    if (!mapEl) return;

    this.mapInitialized = true;
    const center = { lat: this.parcela.ubicacion.lat, lng: this.parcela.ubicacion.lng };

    const map = new google.maps.Map(mapEl, {
      center,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: true,
      fullscreenControl: true,
    });

    new google.maps.Marker({
      position: center,
      map,
      title: this.parcela.nombre,
    });
  }

  cargarMuestras() {
    this.muestrasService.listarPorParcela(this.parcelaId).subscribe({
      next: (res) => {
        try {
          this.muestras = res.data || [];
        } catch (e) {
          console.error('Error in cargarMuestras next:', e);
        } finally {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading muestras for parcela:', err);
        this.cdr.detectChanges();
      }
    });
  }

  nuevaMuestra() {
    this.router.navigate(['/muestras/nueva'], { queryParams: { parcelaId: this.parcelaId } });
  }

  nivelClass(nivel: string | undefined): string {
    const map: any = { severo: 'red', moderado: 'amber', leve: 'green' };
    return map[nivel || ''] || 'gray';
  }

  /** Devuelve el icono según la parte afectada de la muestra. */
  iconoParte(parte: string | undefined): string {
    const map: Record<string, string> = {
      hoja: 'hoja', fruto: 'fruto', tallo: 'tallo', raiz: 'raiz', flor: 'flor',
      planta_completa: 'planta-completa',
    };
    const key = map[(parte || '').toLowerCase()] || 'cacao';
    return `/icons/${key}.svg`;
  }
}
