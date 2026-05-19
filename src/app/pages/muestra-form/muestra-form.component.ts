import { Component, OnInit } from '@angular/core';
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

  partesAfectadas = ['hoja', 'fruto', 'tallo', 'raiz', 'flor', 'planta_completa'];
  nivelesAfectacion = ['leve', 'moderado', 'severo'];
  tiposImagen = ['hoja', 'fruto', 'tallo', 'planta_completa', 'suelo'];

  imagenes: ImagenItem[] = [];

  sensorMode: 'exacto' | 'visual' = 'exacto';

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
    private route: ActivatedRoute
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
    this.parcelasService.listar().subscribe({ next: (res) => this.parcelas = res.data || [] });
  }

  toggleSintoma(s: string) {
    const idx = this.sintomasSeleccionados.indexOf(s);
    idx >= 0 ? this.sintomasSeleccionados.splice(idx, 1) : this.sintomasSeleccionados.push(s);
  }

  isSintomaSelected(s: string) { return this.sintomasSeleccionados.includes(s); }

  onFilesSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenes.push({
          file,
          preview: e.target?.result as string,
          tipoImagen: 'fruto',
          descripcion: ''
        });
      };
      reader.readAsDataURL(file);
    });
    (event.target as HTMLInputElement).value = '';
  }

  removeImagen(index: number) {
    this.imagenes.splice(index, 1);
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
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
      sintomas: this.sintomasSeleccionados,
      datosSensor
    };

    this.muestrasService.crear(payload as any).subscribe({
      next: (res) => {
        const muestraId = res.data?.id || '';
        if (this.imagenes.length === 0 || !muestraId) {
          this.router.navigate(['/muestras', muestraId]);
          return;
        }
        const uploads$ = this.imagenes.map(img =>
          this.imagenesService.subir(muestraId, img.file, img.tipoImagen, img.descripcion)
            .pipe(catchError(() => of(null)))
        );
        forkJoin(uploads$).subscribe(() => {
          this.router.navigate(['/muestras', muestraId]);
        });
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Error al guardar'; this.saving = false; }
    });
  }

  get f() { return this.form.controls; }
}
