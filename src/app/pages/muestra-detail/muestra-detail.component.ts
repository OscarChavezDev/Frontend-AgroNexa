import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MuestrasService } from '../../core/services/muestras.service';
import { DiagnosticosService } from '../../core/services/diagnosticos.service';
import { ImagenesService } from '../../core/services/imagenes.service';
import { Muestra, ImagenMuestra } from '../../core/models/muestra.model';
import { Diagnostico, ResultadoGemini } from '../../core/models/diagnostico.model';

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
  analizandoIA = false;
  errorMsg = '';
  muestraId = '';

  creadoExito = false;
  solicitandoConsulta = false;
  consultaEnviada = false;

  pestanaRec: 'inmediatas' | 'tratamiento' | 'prevencion' | 'monitoreo' = 'inmediatas';
  mostrarDiferenciales = false;

  constructor(
    private route: ActivatedRoute,
    private muestrasService: MuestrasService,
    private diagnosticosService: DiagnosticosService,
    private imagenesService: ImagenesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.muestraId = id;
        this.cargar();
      } else {
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
    this.loading = true;
    this.cdr.detectChanges();
    this.muestrasService.obtener(this.muestraId).subscribe({
      next: (res) => {
        this.muestra = res.data || null;
        this.loading = false;
        this.cargarImagenes();
        this.cargarDiagnostico();
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'Error al cargar la muestra';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarImagenes() {
    this.imagenesService.listarPorMuestra(this.muestraId).subscribe({
      next: (res) => {
        this.imagenes = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges()
    });
  }

  cargarDiagnostico() {
    this.muestrasService.obtenerDiagnostico(this.muestraId).subscribe({
      next: (res) => {
        const data = res.data as any;
        if (data && 'diagnostico' in data && data.diagnostico === null) {
          this.diagnostico = null;
          // Auto-analizar si la muestra acaba de ser creada
          if (this.creadoExito) {
            setTimeout(() => this.generarDiagnosticoIA(), 600);
          }
        } else {
          this.diagnostico = data || null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.diagnostico = null;
        this.cdr.detectChanges();
      }
    });
  }

  generarDiagnosticoIA() {
    this.analizandoIA = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
    this.diagnosticosService.generar(this.muestraId).subscribe({
      next: (res) => {
        this.diagnostico = res.data || null;
        this.analizandoIA = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al analizar con IA';
        this.analizandoIA = false;
        this.cdr.detectChanges();
      }
    });
  }

  regenerarDiagnosticoIA() {
    this.analizandoIA = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
    this.diagnosticosService.regenerar(this.muestraId).subscribe({
      next: (res) => {
        this.diagnostico = res.data || null;
        this.analizandoIA = false;
        this.pestanaRec = 'inmediatas';
        this.mostrarDiferenciales = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al regenerar diagnóstico';
        this.analizandoIA = false;
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

  // ── Helpers ──────────────────────────────────────────────────────────────────

  get resultadoGemini(): ResultadoGemini | null {
    return (this.diagnostico as any)?.resultado_json || null;
  }

  get esGemini(): boolean {
    return !!this.resultadoGemini && this.diagnostico?.estado === 'completado';
  }

  get esError(): boolean {
    return this.diagnostico?.estado === 'error';
  }

  get confianzaClass(): string {
    const map: Record<string, string> = { alta: 'green', media: 'amber', baja: 'red' };
    return map[this.resultadoGemini?.diagnostico_principal?.confianza || ''] || 'gray';
  }

  get severidadClass(): string {
    const map: Record<string, string> = {
      leve: 'green', moderado: 'amber', severo: 'orange', crítico: 'red'
    };
    return map[this.resultadoGemini?.severidad?.nivel || ''] || 'gray';
  }

  get riesgoClass(): string {
    const map: Record<string, string> = { alto: 'red', moderado: 'amber', bajo: 'green' };
    return map[(this.diagnostico as any)?.resultado?.riesgo || ''] || 'gray';
  }
}
