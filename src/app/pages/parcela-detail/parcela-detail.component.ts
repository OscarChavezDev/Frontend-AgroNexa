import { Component, OnInit, AfterViewInit } from '@angular/core';
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
    private muestrasService: MuestrasService
  ) {}

  ngOnInit() {
    this.parcelaId = this.route.snapshot.paramMap.get('id') || '';
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.parcelasService.obtener(this.parcelaId).subscribe({
      next: (res) => {
        this.parcela = res.data || null;
        this.loading = false;
        this.cargarMuestras();
        if (this.parcela?.ubicacion) {
          setTimeout(() => this.waitForMapsAndInit(), 0);
        }
      },
      error: () => { this.errorMsg = 'Error al cargar la parcela'; this.loading = false; }
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
      next: (res) => this.muestras = res.data || []
    });
  }

  nuevaMuestra() {
    this.router.navigate(['/muestras/nueva'], { queryParams: { parcelaId: this.parcelaId } });
  }

  nivelClass(nivel: string | undefined): string {
    const map: any = { severo: 'red', moderado: 'amber', leve: 'green' };
    return map[nivel || ''] || 'gray';
  }
}
