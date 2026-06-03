import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CULTIVO_OPTIONS, CultivoOption, normalizeCultivo } from '../../core/constants/cultivos';
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

  cultivoOpciones: CultivoOption[] = CULTIVO_OPTIONS;
  sistemasOpciones = ['monocultivo', 'agroforestal', 'mixto', 'org\u00E1nico', 'otro'];
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
      zoom: hasCoords ? 14 : 6,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.TERRAIN],
      },
      streetViewControl: false,
    });

    if (hasCoords) {
      this.placeMarker(center);
    } else {
      this.tryUseCurrentLocation();
    }

    this.map.addListener('click', (event: any) => {
      this.ngZone.run(() => {
        this.placeMarker({ lat: event.latLng.lat(), lng: event.latLng.lng() });
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
          this.map.setZoom(15);
          this.placeMarker(location);
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
        title: 'Ubicacion de la parcela',
      });

      this.marker.addListener('dragend', (event: any) => {
        this.ngZone.run(() => {
          this.updateCoords(event.latLng.lat(), event.latLng.lng());
        });
      });
    }

    this.updateCoords(position.lat, position.lng);
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
          this.map.setZoom(16);
          this.placeMarker(currentLocation);
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

            const cultivoVal = normalizeCultivo(parcela.cultivo);
            const selectedCultivo = this.cultivoOpciones.find((option) => option.key === cultivoVal);

            if (selectedCultivo && cultivoVal !== 'otro') {
              this.form.patchValue({ cultivo: selectedCultivo.value });
            } else if (parcela.cultivo) {
              this.form.patchValue({ cultivo: 'otro', otroCultivo: parcela.cultivo });
            }

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
    const finalCultivo = normalizeCultivo(rest.cultivo) === 'otro' ? rest.otroCultivo : rest.cultivo;
    const payload = {
      ...rest,
      cultivo: finalCultivo,
      ubicacion: { lat: +lat, lng: +lng }
    };

    delete (payload as any).otroCultivo;

    const onSuccess = () => this.router.navigate(['/parcelas']);
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
