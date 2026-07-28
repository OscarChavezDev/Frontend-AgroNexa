import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CULTIVO_OPTIONS, CultivoOption, normalizeCultivo } from '../../core/constants/cultivos';
import { ParcelasService } from '../../core/services/parcelas.service';
import { PopupService } from '../../shared/services/popup.service';
import { NodoParcela, Ubicacion } from '../../core/models/parcela.model';

declare var google: any;

type ModoMapa = 'punto' | 'lindero' | 'nodos';

/** Nodo mientras se edita: el id definitivo lo asigna el backend al guardar. */
interface NodoEditable {
  id?: string;
  nombre: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-parcela-form',
  templateUrl: './parcela-form.component.html',
  styleUrls: ['./parcela-form.component.scss'],
  standalone: false
})
export class ParcelaFormComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  loading = false;
  saving = false;
  errorMsg = '';
  isEdit = false;
  parcelaId = '';

  modoMapa: ModoMapa = 'punto';
  nodos: NodoEditable[] = [];
  poligono: Ubicacion[] = [];
  areaCalculadaHa: number | null = null;

  private map: any;
  private marker: any;
  private poligonoShape: any;
  private vertexMarkers: any[] = [];
  private nodoMarkers: any[] = [];
  private mapInitialized = false;

  cultivoOpciones: CultivoOption[] = CULTIVO_OPTIONS.filter(opt => opt.key === 'cacao');
  sistemasOpciones = ['monocultivo', 'agroforestal', 'mixto', 'orgánico', 'otro'];
  showAvanzados = false;

  constructor(
    private fb: FormBuilder,
    private parcelasService: ParcelasService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private popupService: PopupService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      cultivo: ['cacao', Validators.required],
      otroCultivo: [''],
      variedad: [''],
      areaAproximada: [''],
      unidadArea: ['ha'],
      edadCultivo: [''],
      cantidadPlantas: [''],
      sistemaCultivo: [''],
      referencia: ['', Validators.required],
      observaciones: [''],
      lat: ['', Validators.required],
      lng: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.form.get('cultivo')?.valueChanges.subscribe((value) => {
      const otroControl = this.form.get('otroCultivo');
      if (normalizeCultivo(value) === 'otro') {
        otroControl?.setValidators([Validators.required]);
      } else {
        otroControl?.clearValidators();
      }
      otroControl?.updateValueAndValidity();
    });

    this.route.paramMap.subscribe((params) => {
      this.parcelaId = params.get('id') || '';
      this.isEdit = !!this.parcelaId && this.route.snapshot.url.some((segment) => segment.path === 'editar');
      if (this.isEdit) {
        this.cargarParcela();
      } else {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    if (!this.isEdit) {
      this.waitForMapsAndInit();
    }
  }

  private waitForMapsAndInit(attempt = 0) {
    if (typeof google !== 'undefined' && google.maps) {
      this.initMap();
    } else if (attempt < 20) {
      setTimeout(() => this.waitForMapsAndInit(attempt + 1), 300);
    }
  }

  private initMap() {
    if (this.mapInitialized) return;

    const mapEl = document.getElementById('parcela-map');
    const searchEl = document.getElementById('parcela-search') as HTMLInputElement;
    if (!mapEl) return;

    this.mapInitialized = true;

    const lat = this.form.value.lat;
    const lng = this.form.value.lng;
    const hasCoords = lat && lng;
    const center = hasCoords ? { lat: +lat, lng: +lng } : { lat: -9.19, lng: -75.0152 };

    this.map = new google.maps.Map(mapEl, {
      center,
      zoom: hasCoords ? 16 : 6,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        mapTypeIds: [
          google.maps.MapTypeId.ROADMAP,
          google.maps.MapTypeId.TERRAIN,
          google.maps.MapTypeId.HYBRID,
        ],
      },
      streetViewControl: false,
    });

    if (hasCoords) {
      this.placeMarker(center);
    } else {
      this.tryUseCurrentLocation();
    }

    // Lo dibujado al cargar una parcela existente se pinta una vez que hay mapa.
    this.redibujarPoligono();
    this.redibujarNodos();
    this.ajustarVista();

    this.map.addListener('click', (event: any) => {
      this.ngZone.run(() => {
        this.onMapClick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
      });
    });

    if (searchEl) {
      const autocomplete = new google.maps.places.Autocomplete(searchEl, {
        fields: ['geometry'],
      });

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;

          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };

          this.map.setCenter(location);
          this.map.setZoom(17);
          if (this.modoMapa === 'punto') this.placeMarker(location);
        });
      });
    }
  }

  // ── Interacción con el mapa ────────────────────────────────────────────────

  private onMapClick(pos: Ubicacion) {
    if (this.modoMapa === 'lindero') {
      this.poligono.push(pos);
      this.redibujarPoligono();
      this.sincronizarDesdeMapa();
    } else if (this.modoMapa === 'nodos') {
      this.nodos.push({ nombre: `Nodo ${this.nodos.length + 1}`, ...pos });
      this.redibujarNodos();
      this.sincronizarDesdeMapa();
    } else {
      this.placeMarker(pos);
    }
    this.cdr.detectChanges();
  }

  cambiarModo(modo: ModoMapa) {
    this.modoMapa = modo;
    this.cdr.detectChanges();
  }

  private placeMarker(position: Ubicacion) {
    if (this.marker) {
      this.marker.setPosition(position);
    } else {
      this.marker = new google.maps.Marker({
        position,
        map: this.map,
        draggable: true,
        title: 'Ubicación de la parcela',
      });

      this.marker.addListener('dragend', (event: any) => {
        this.ngZone.run(() => {
          this.updateCoords(event.latLng.lat(), event.latLng.lng());
        });
      });
    }

    this.updateCoords(position.lat, position.lng);
  }

  // ── Lindero (polígono) ─────────────────────────────────────────────────────

  private redibujarPoligono() {
    if (!this.map) return;

    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];

    if (this.poligonoShape) {
      this.poligonoShape.setMap(null);
      this.poligonoShape = null;
    }

    if (!this.poligono.length) {
      this.areaCalculadaHa = null;
      return;
    }

    this.poligonoShape = new google.maps.Polygon({
      paths: this.poligono,
      map: this.map,
      strokeColor: '#4ade80',
      strokeWeight: 2,
      fillColor: '#4ade80',
      fillOpacity: 0.18,
    });

    this.poligono.forEach((punto, i) => {
      const marker = new google.maps.Marker({
        position: punto,
        map: this.map,
        draggable: true,
        title: `Vértice ${i + 1}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#4ade80',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('dragend', (event: any) => {
        this.ngZone.run(() => {
          this.poligono[i] = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          this.redibujarPoligono();
          this.sincronizarDesdeMapa();
          this.cdr.detectChanges();
        });
      });

      this.vertexMarkers.push(marker);
    });

    this.calcularArea();
  }

  /**
   * El área sale del polígono en lugar de escribirse a mano: es el dato que
   * multiplica todas las dosis del plan de fertilización, así que conviene que
   * venga medido y no estimado.
   */
  private calcularArea() {
    if (this.poligono.length < 3 || !google.maps.geometry?.spherical) {
      this.areaCalculadaHa = null;
      return;
    }

    const metrosCuadrados = google.maps.geometry.spherical.computeArea(
      this.poligono.map(p => new google.maps.LatLng(p.lat, p.lng))
    );
    this.areaCalculadaHa = +(metrosCuadrados / 10000).toFixed(2);
  }

  usarAreaCalculada() {
    if (this.areaCalculadaHa == null) return;
    this.form.patchValue({ areaAproximada: this.areaCalculadaHa, unidadArea: 'ha' });
    this.cdr.detectChanges();
  }

  quitarUltimoVertice() {
    this.poligono.pop();
    this.redibujarPoligono();
    this.sincronizarDesdeMapa();
    this.cdr.detectChanges();
  }

  limpiarLindero() {
    this.poligono = [];
    this.redibujarPoligono();
    this.cdr.detectChanges();
  }

  // ── Nodos de muestreo ──────────────────────────────────────────────────────

  private redibujarNodos() {
    if (!this.map) return;

    this.nodoMarkers.forEach(m => m.setMap(null));
    this.nodoMarkers = [];

    this.nodos.forEach((nodo, i) => {
      const marker = new google.maps.Marker({
        position: { lat: nodo.lat, lng: nodo.lng },
        map: this.map,
        draggable: true,
        title: nodo.nombre,
        label: { text: String(i + 1), color: '#ffffff', fontSize: '11px', fontWeight: '700' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: '#1d4ed8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('dragend', (event: any) => {
        this.ngZone.run(() => {
          this.nodos[i] = {
            ...this.nodos[i],
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };
          this.sincronizarDesdeMapa();
          this.cdr.detectChanges();
        });
      });

      this.nodoMarkers.push(marker);
    });
  }

  eliminarNodo(indice: number) {
    this.nodos.splice(indice, 1);
    this.redibujarNodos();
    this.sincronizarDesdeMapa();
    this.cdr.detectChanges();
  }

  renombrarNodo(indice: number, nombre: string) {
    this.nodos[indice] = { ...this.nodos[indice], nombre };
  }

  limpiarNodos() {
    this.nodos = [];
    this.redibujarNodos();
    this.cdr.detectChanges();
  }

  // ── Sincronización y utilidades ────────────────────────────────────────────

  /** Con lindero o nodos dibujados, el punto principal se deduce del centroide. */
  private sincronizarDesdeMapa() {
    const centro = this.centroide();
    if (!centro) return;

    this.updateCoords(centro.lat, centro.lng);
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
  }

  private centroide(): Ubicacion | null {
    const puntos = this.poligono.length
      ? this.poligono
      : this.nodos.map(n => ({ lat: n.lat, lng: n.lng }));

    if (!puntos.length) return null;
    return {
      lat: puntos.reduce((s, p) => s + p.lat, 0) / puntos.length,
      lng: puntos.reduce((s, p) => s + p.lng, 0) / puntos.length,
    };
  }

  private ajustarVista() {
    const puntos = [
      ...this.poligono,
      ...this.nodos.map(n => ({ lat: n.lat, lng: n.lng })),
    ];
    if (!puntos.length || !this.map) return;

    const bounds = new google.maps.LatLngBounds();
    puntos.forEach(p => bounds.extend(new google.maps.LatLng(p.lat, p.lng)));
    this.map.fitBounds(bounds);
  }

  private tryUseCurrentLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          this.map.setCenter(currentLocation);
          this.map.setZoom(17);
          if (this.modoMapa === 'punto' && !this.poligono.length && !this.nodos.length) {
            this.placeMarker(currentLocation);
          }
        });
      },
      () => {
        // Si el usuario no concede permiso, mantenemos el centro por defecto.
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  private updateCoords(lat: number, lng: number) {
    this.form.patchValue({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
  }

  get tieneMapaDibujado(): boolean {
    return this.poligono.length > 0 || this.nodos.length > 0;
  }

  cargarParcela() {
    this.loading = true;
    this.cdr.detectChanges();

    this.parcelasService.obtener(this.parcelaId).subscribe({
      next: (response) => {
        try {
          const parcela = response?.data;
          if (parcela) {
            this.form.patchValue({
              ...parcela,
              lat: parcela.ubicacion?.lat,
              lng: parcela.ubicacion?.lng
            });

            this.poligono = (parcela.poligono || []).map(p => ({ lat: p.lat, lng: p.lng }));
            this.nodos = (parcela.nodos || []).map((n: NodoParcela) => ({
              id: n.id,
              nombre: n.nombre,
              lat: n.lat,
              lng: n.lng,
            }));
            if (this.poligono.length) this.modoMapa = 'lindero';
            else if (this.nodos.length) this.modoMapa = 'nodos';

            // Enforce cacao
            this.form.patchValue({ cultivo: 'cacao' });

            setTimeout(() => this.waitForMapsAndInit(), 0);
          } else {
            this.errorMsg = 'No se encontraron datos de la parcela';
          }
          this.loading = false;
        } catch (error) {
          console.error('Error in ParcelaForm cargarParcela next:', error);
          this.errorMsg = 'Error al procesar datos de la parcela';
          this.loading = false;
        } finally {
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error fetching Parcela for edit:', error);
        this.errorMsg = 'Error al cargar parcela';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarCultivo(cultivo: string) {
    this.form.patchValue({ cultivo });
    this.form.get('cultivo')?.markAsTouched();
  }

  isCultivoSeleccionado(cultivo: CultivoOption): boolean {
    return normalizeCultivo(this.form.get('cultivo')?.value) === cultivo.key;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    const { lat, lng, ...rest } = this.form.value;
    const payload = {
      ...rest,
      cultivo: 'cacao',
      ubicacion: { lat: +lat, lng: +lng },
      poligono: this.poligono,
      nodos: this.nodos,
    };
    delete (payload as any).otroCultivo;

    const onSuccess = () => {
      this.popupService.success('¡Parcela guardada!', 'Los datos de la parcela se registraron con éxito.');
      this.router.navigate(['/parcelas']);
    };
    const onError = (error: any) => {
      try {
        this.errorMsg = error.error?.message || 'Error al guardar';
      } catch {
        this.errorMsg = 'Error de red al guardar';
      } finally {
        this.saving = false;
        this.cdr.detectChanges();
      }
    };

    if (this.isEdit) {
      this.parcelasService.actualizar(this.parcelaId, payload).subscribe({ next: onSuccess, error: onError });
    } else {
      this.parcelasService.crear(payload).subscribe({ next: onSuccess, error: onError });
    }
  }

  trackCultivo(_: number, cultivo: CultivoOption) {
    return cultivo.key;
  }

  get f() {
    return this.form.controls;
  }
}
