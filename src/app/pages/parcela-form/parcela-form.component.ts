import { Component, OnInit, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ParcelasService } from '../../core/services/parcelas.service';

declare var google: any;

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

  private map: any;
  private marker: any;
  private mapInitialized = false;

  cultivoOpciones = ['cacao', 'café', 'maíz', 'papa', 'arroz', 'quinua', 'palto', 'mango', 'plátano', 'otro'];
  sistemasOpciones = ['monocultivo', 'agroforestal', 'mixto', 'orgánico', 'otro'];
  showAvanzados = false;

  constructor(
    private fb: FormBuilder,
    private parcelasService: ParcelasService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      cultivo: ['', Validators.required],
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
    this.route.paramMap.subscribe(params => {
      this.parcelaId = params.get('id') || '';
      this.isEdit = !!this.parcelaId && this.route.snapshot.url.some(s => s.path === 'editar');
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
      zoom: hasCoords ? 14 : 6,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      mapTypeControl: true,
      streetViewControl: false,
    });

    if (hasCoords) {
      this.placeMarker(center);
    }

    this.map.addListener('click', (e: any) => {
      this.ngZone.run(() => {
        this.placeMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
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
          const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          this.map.setCenter(loc);
          this.map.setZoom(15);
          this.placeMarker(loc);
        });
      });
    }
  }

  private placeMarker(position: { lat: number; lng: number }) {
    if (this.marker) {
      this.marker.setPosition(position);
    } else {
      this.marker = new google.maps.Marker({
        position,
        map: this.map,
        draggable: true,
        title: 'Ubicación de la parcela',
      });
      this.marker.addListener('dragend', (e: any) => {
        this.ngZone.run(() => {
          this.updateCoords(e.latLng.lat(), e.latLng.lng());
        });
      });
    }
    this.updateCoords(position.lat, position.lng);
  }

  private updateCoords(lat: number, lng: number) {
    this.form.patchValue({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
  }

  cargarParcela() {
    this.loading = true;
    this.cdr.detectChanges();
    this.parcelasService.obtener(this.parcelaId).subscribe({
      next: (res) => {
        try {
          const p = res?.data;
          if (p) {
            this.form.patchValue({
              ...p,
              lat: p.ubicacion?.lat,
              lng: p.ubicacion?.lng
            });
            setTimeout(() => this.waitForMapsAndInit(), 0);
          } else {
            this.errorMsg = 'No se encontraron datos de la parcela';
          }
          this.loading = false;
        } catch (e) {
          console.error('Error in ParcelaForm cargarParcela next:', e);
          this.errorMsg = 'Error al procesar datos de la parcela';
          this.loading = false;
        } finally {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching Parcela for edit:', err);
        this.errorMsg = 'Error al cargar parcela';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.cdr.detectChanges();
    const { lat, lng, ...rest } = this.form.value;
    const payload = { ...rest, ubicacion: { lat: +lat, lng: +lng } };

    const onSuccess = () => this.router.navigate(['/parcelas']);
    const onError = (err: any) => {
      try {
        this.errorMsg = err.error?.message || 'Error al guardar';
      } catch (e) {
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

  get f() { return this.form.controls; }
}
