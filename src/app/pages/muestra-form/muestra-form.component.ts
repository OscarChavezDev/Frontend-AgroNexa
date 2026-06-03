import { Component, OnInit, ChangeDetectorRef, HostListener, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MuestrasService } from '../../core/services/muestras.service';
import { ParcelasService } from '../../core/services/parcelas.service';
import { ImagenesService } from '../../core/services/imagenes.service';
import { Parcela } from '../../core/models/parcela.model';

interface ImagenItem {
  file: File;
  preview: string;
  tipoImagen: string;
  descripcion: string;
  validando: boolean;
  validacion: { relevante: boolean; motivo: string } | null;
}

interface ParteAfectadaOption {
  value: string;
  label: string;
  icon: string;
  iconPath?: string;
}

@Component({
  selector: 'app-muestra-form',
  templateUrl: './muestra-form.component.html',
  styleUrls: ['./muestra-form.component.scss'],
  standalone: false
})
export class MuestraFormComponent implements OnInit {
  form: FormGroup;
  saving = false;
  errorMsg = '';
  parcelas: Parcela[] = [];

  sintomasDisponibles = [
    'manchas oscuras', 'manchas amarillas', 'pudricion', 'polvo blanco',
    'fruto seco', 'fruto deformado', 'hojas secas', 'ramas secas',
    'brotes deformados', 'marchitez', 'caida de frutos', 'hongos visibles'
  ];
  sintomasSeleccionados: string[] = [];
  sinSintomaVisible = false;

  partesAfectadas: ParteAfectadaOption[] = [
    { value: 'hoja', label: 'Hoja', icon: '', iconPath: '/icons/hoja.svg' },
    { value: 'fruto', label: 'Fruto', icon: '', iconPath: '/icons/fruto.svg' },
    { value: 'tallo', label: 'Tallo', icon: '', iconPath: '/icons/tallo.svg' },
    { value: 'raiz', label: 'Raiz', icon: '', iconPath: '/icons/raiz.svg' },
    { value: 'flor', label: 'Flor', icon: '', iconPath: '/icons/flor.svg' },
    { value: 'planta_completa', label: 'Planta completa', icon: '', iconPath: '/icons/planta-completa.svg' }
  ];
  nivelesAfectacion = ['leve', 'moderado', 'severo'];
  tiposImagen = ['hoja', 'fruto', 'tallo', 'planta_completa', 'suelo'];

  imagenes: ImagenItem[] = [];
  hayImagenesInvalidas = false;
  hayImagenesValidando  = false;
  loadingParcelas = true;
  parcelaDropdownAbierto = false;

  sensorMode: 'visual' | 'exacto' = 'visual';

  sensorNiveles: Record<string, 'bajo' | 'medio' | 'alto' | ''> = {
    ph: '', nitrogeno: '', fosforo: '', potasio: '', humedadSuelo: ''
  };

  metricasVisuales = [
    { key: 'ph',          label: 'pH del suelo' },
    { key: 'nitrogeno',   label: 'Nitrógeno' },
    { key: 'fosforo',     label: 'Fósforo' },
    { key: 'potasio',     label: 'Potasio' },
    { key: 'humedadSuelo', label: 'Humedad' },
  ];

  private nivelToNumero: Record<string, Record<string, number>> = {
    ph:          { bajo: 5.0,  medio: 6.5,  alto: 8.0  },
    nitrogeno:   { bajo: 15,   medio: 45,   alto: 80   },
    fosforo:     { bajo: 10,   medio: 30,   alto: 55   },
    potasio:     { bajo: 60,   medio: 120,  alto: 200  },
    humedadSuelo:{ bajo: 25,   medio: 55,   alto: 80   },
  };

  setSensorNivel(key: string, nivel: 'bajo' | 'medio' | 'alto') {
    this.sensorNiveles[key] = this.sensorNiveles[key] === nivel ? '' : nivel;
  }

  constructor(
    private fb: FormBuilder,
    private muestrasService: MuestrasService,
    private parcelasService: ParcelasService,
    private imagenesService: ImagenesService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.form = this.fb.group({
      parcelaId: ['', Validators.required],
      parteAfectada: ['', Validators.required],
      nivelAfectacion: ['leve', Validators.required],
      observaciones: [''],
      ph: [''],
      nitrogeno: [''],
      fosforo: [''],
      potasio: [''],
      humedadSuelo: [''],
      temperaturaSuelo: [''],
      conductividadElectrica: ['']
    });
  }

  ngOnInit() {
    const parcelaId = this.route.snapshot.queryParamMap.get('parcelaId') || '';
    if (parcelaId) this.form.patchValue({ parcelaId });
    this.parcelasService.listar().subscribe({
      next: (res) => { this.parcelas = res.data || []; this.loadingParcelas = false; this.cdr.detectChanges(); },
      error: () => { this.loadingParcelas = false; this.cdr.detectChanges(); }
    });
  }

  toggleSintoma(s: string) {
    // Deactivate "sin síntoma" when a real symptom is selected
    this.sinSintomaVisible = false;
    const idx = this.sintomasSeleccionados.indexOf(s);
    idx >= 0 ? this.sintomasSeleccionados.splice(idx, 1) : this.sintomasSeleccionados.push(s);
  }

  toggleSinSintoma() {
    this.sinSintomaVisible = !this.sinSintomaVisible;
    if (this.sinSintomaVisible) {
      this.sintomasSeleccionados = [];
    }
  }

  isSintomaSelected(s: string) { return this.sintomasSeleccionados.includes(s); }

  onFilesSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const item: ImagenItem = {
        file,
        preview: URL.createObjectURL(file),
        tipoImagen: '',
        descripcion: '',
        validando: true,
        validacion: null,
      };

      // (change) del input ya está dentro de la zona — actualización directa
      this.imagenes = [...this.imagenes, item];
      this.hayImagenesValidando = true;
      this.cdr.detectChanges(); // muestra el spinner inmediatamente

      this.imagenesService.validar(file).subscribe({
        next: (res) => {
          this.zone.run(() => {
            if (this.imagenes.includes(item)) {
              item.validando  = false;
              item.validacion = res.data ?? null;
              this.sincronizarEstadoImagenes();
            }
          });
        },
        error: () => {
          this.zone.run(() => {
            if (this.imagenes.includes(item)) {
              item.validando  = false;
              item.validacion = { relevante: true, motivo: '' };
              this.sincronizarEstadoImagenes();
            }
          });
        }
      });
    });
    (event.target as HTMLInputElement).value = '';
  }

  removeImagen(index: number) {
    // Este método viene de un (click), ya está dentro de la zona de Angular.
    // No usar zone.run() aquí — causaría ciclos anidados que difieren el render.
    this.imagenes = this.imagenes.filter((_, i) => i !== index);
    this.errorMsg = '';
    this.hayImagenesValidando = this.imagenes.some(img => img.validando);
    this.hayImagenesInvalidas = this.imagenes.some(img => !img.validando && img.validacion?.relevante === false);
    this.cdr.detectChanges();
  }

  // Usado solo desde callbacks HTTP (fuera del ciclo de eventos de Angular)
  private sincronizarEstadoImagenes() {
    this.imagenes = [...this.imagenes]; // nueva ref: fuerza re-evaluación del *ngFor
    this.hayImagenesValidando = this.imagenes.some(img => img.validando);
    this.hayImagenesInvalidas = this.imagenes.some(img => !img.validando && img.validacion?.relevante === false);
    this.cdr.detectChanges();
  }

  get imagenesValidando(): boolean  { return this.hayImagenesValidando; }
  get imagenesNoRelevantes(): ImagenItem[] {
    return this.imagenes.filter(img => !img.validando && img.validacion?.relevante === false);
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (this.imagenesValidando) {
      this.errorMsg = 'Espera a que terminen de verificarse todas las imágenes.';
      this.cdr.detectChanges();
      return;
    }

    if (this.imagenesNoRelevantes.length > 0) {
      const n = this.imagenesNoRelevantes.length;
      this.errorMsg = n === 1
        ? 'Hay una imagen que no corresponde a cultivos o plantas. Elimínala antes de continuar.'
        : `Hay ${n} imágenes que no corresponden a cultivos o plantas. Elimínalas antes de continuar.`;
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    const v = this.form.value;
    let datosSensor: Record<string, number | null>;
    if (this.sensorMode === 'exacto') {
      datosSensor = {
        ph: v.ph ? +v.ph : null,
        nitrogeno: v.nitrogeno ? +v.nitrogeno : null,
        fosforo: v.fosforo ? +v.fosforo : null,
        potasio: v.potasio ? +v.potasio : null,
        humedadSuelo: v.humedadSuelo ? +v.humedadSuelo : null,
        temperaturaSuelo: v.temperaturaSuelo ? +v.temperaturaSuelo : null,
        conductividadElectrica: v.conductividadElectrica ? +v.conductividadElectrica : null,
      };
    } else {
      datosSensor = { temperaturaSuelo: null, conductividadElectrica: null };
      Object.entries(this.sensorNiveles).forEach(([key, nivel]) => {
        datosSensor[key] = nivel ? this.nivelToNumero[key][nivel] : null;
      });
    }

    const payload = {
      parcelaId: v.parcelaId,
      parteAfectada: v.parteAfectada,
      nivelAfectacion: v.nivelAfectacion,
      observaciones: v.observaciones,
      sintomas: this.sinSintomaVisible ? [] : this.sintomasSeleccionados,
      datosSensor
    };

    this.muestrasService.crear(payload as any).subscribe({
      next: (res) => {
        const muestraId = res.data?.id || '';
        if (this.imagenes.length === 0 || !muestraId) {
          this.router.navigate(['/muestras', muestraId], { queryParams: { creado: 'true' } });
          return;
        }
        const uploads$ = this.imagenes.map(img =>
          this.imagenesService.subir(muestraId, img.file, img.tipoImagen, img.descripcion)
            .pipe(catchError(() => of(null)))
        );
        forkJoin(uploads$).subscribe(() => {
          this.router.navigate(['/muestras', muestraId], { queryParams: { creado: 'true' } });
        });
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Error al guardar'; this.saving = false; }
    });
  }

  get parcelaSeleccionada(): Parcela | undefined {
    const id = this.form.get('parcelaId')?.value;
    return id ? this.parcelas.find(p => p.id === id) : undefined;
  }

  seleccionarParcela(p: Parcela): void {
    this.form.patchValue({ parcelaId: p.id });
    this.parcelaDropdownAbierto = false;
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('.parcela-selector')) {
      this.parcelaDropdownAbierto = false;
    }
  }

  formatTipo(t: string): string {
    return t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  seleccionarParteAfectada(parte: string) {
    this.form.patchValue({ parteAfectada: parte });
    this.form.get('parteAfectada')?.markAsTouched();
  }

  isParteAfectadaSeleccionada(parte: string): boolean {
    return this.form.get('parteAfectada')?.value === parte;
  }

  trackParteAfectada(_: number, parte: ParteAfectadaOption) {
    return parte.value;
  }

  get f() { return this.form.controls; }
}
