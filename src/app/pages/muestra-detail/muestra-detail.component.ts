import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MuestrasService } from '../../core/services/muestras.service';
import { DiagnosticosService } from '../../core/services/diagnosticos.service';
import { ImagenesService } from '../../core/services/imagenes.service';
import { Muestra, ImagenMuestra } from '../../core/models/muestra.model';
import { Diagnostico } from '../../core/models/diagnostico.model';

@Component({
  selector: 'app-muestra-detail',
  templateUrl: './muestra-detail.component.html',
  styleUrls: ['./muestra-detail.component.scss'],
  standalone: false
})
export class MuestraDetailComponent implements OnInit {
  muestra: Muestra | null = null;
  diagnostico: Diagnostico | null = null;
  imagenes: ImagenMuestra[] = [];
  loading = true;
  generando = false;
  errorMsg = '';
  muestraId = '';

  creadoExito = false;
  solicitandoConsulta = false;
  consultaEnviada = false;

  constructor(
    private route: ActivatedRoute,
    private muestrasService: MuestrasService,
    private diagnosticosService: DiagnosticosService,
    private imagenesService: ImagenesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('MuestraDetailComponent: ngOnInit called');
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('MuestraDetailComponent: paramMap id =', id);
      if (id) {
        this.muestraId = id;
        this.cargar();
      } else {
        console.warn('MuestraDetailComponent: No ID found in paramMap');
        this.errorMsg = 'ID de muestra no válido';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
    this.route.queryParams.subscribe(params => {
      this.creadoExito = params['creado'] === 'true';
      this.cdr.detectChanges();
    });
  }

  cargar() {
    if (!this.muestraId) {
      console.warn('MuestraDetailComponent: cargar called but muestraId is empty');
      this.errorMsg = 'ID de muestra no especificado';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    console.log('MuestraDetailComponent: calling muestrasService.obtener with id =', this.muestraId);
    this.loading = true;
    this.cdr.detectChanges();
    this.muestrasService.obtener(this.muestraId).subscribe({
      next: (res) => {
        console.log('MuestraDetailComponent: muestrasService.obtener next called with res =', res);
        this.muestra = res.data || null;
        this.loading = false;
        this.cargarDiagnostico();
        this.cargarImagenes();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('MuestraDetailComponent: muestrasService.obtener error called with err =', err);
        this.errorMsg = 'Error al cargar la muestra';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarImagenes() {
    console.log('MuestraDetailComponent: calling imagenesService.listarPorMuestra with id =', this.muestraId);
    this.imagenesService.listarPorMuestra(this.muestraId).subscribe({
      next: (res) => {
        console.log('MuestraDetailComponent: imagenesService.listarPorMuestra next called with res =', res);
        this.imagenes = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('MuestraDetailComponent: imagenesService.listarPorMuestra error called with err =', err);
        this.cdr.detectChanges();
      }
    });
  }

  cargarDiagnostico() {
    console.log('MuestraDetailComponent: calling muestrasService.obtenerDiagnostico with id =', this.muestraId);
    this.muestrasService.obtenerDiagnostico(this.muestraId).subscribe({
      next: (res) => {
        console.log('MuestraDetailComponent: muestrasService.obtenerDiagnostico next called with res =', res);
        const data = res.data as any;
        if (data && 'diagnostico' in data && data.diagnostico === null) {
          this.diagnostico = null;
        } else {
          this.diagnostico = data || null;
        }
        console.log('MuestraDetailComponent: set this.diagnostico =', this.diagnostico);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('MuestraDetailComponent: muestrasService.obtenerDiagnostico error called with err =', err);
        this.diagnostico = null;
        this.cdr.detectChanges();
      }
    });
  }

  generarDiagnostico() {
    this.generando = true;
    this.cdr.detectChanges();
    this.diagnosticosService.generar(this.muestraId).subscribe({
      next: (res) => {
        this.diagnostico = res.data || null;
        this.generando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al generar diagnóstico';
        this.generando = false;
        this.cdr.detectChanges();
      }
    });
  }

  consultarEspecialista() {
    this.solicitandoConsulta = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.solicitandoConsulta = false;
      this.consultaEnviada = true;
      this.cdr.detectChanges();
    }, 800);
  }

  get riesgoClass(): string {
    const map: any = { alto: 'red', moderado: 'amber', bajo: 'green' };
    return map[this.diagnostico?.resultado?.riesgo || ''] || 'gray';
  }
}
