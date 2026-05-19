import { Component, OnInit } from '@angular/core';
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

  constructor(
    private route: ActivatedRoute,
    private muestrasService: MuestrasService,
    private diagnosticosService: DiagnosticosService,
    private imagenesService: ImagenesService
  ) {}

  ngOnInit() {
    this.muestraId = this.route.snapshot.paramMap.get('id') || '';
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.muestrasService.obtener(this.muestraId).subscribe({
      next: (res) => {
        this.muestra = res.data || null;
        this.loading = false;
        this.cargarDiagnostico();
        this.cargarImagenes();
      },
      error: () => { this.errorMsg = 'Error al cargar la muestra'; this.loading = false; }
    });
  }

  cargarImagenes() {
    this.imagenesService.listarPorMuestra(this.muestraId).subscribe({
      next: (res) => this.imagenes = res.data || [],
      error: () => {}
    });
  }

  cargarDiagnostico() {
    this.muestrasService.obtenerDiagnostico(this.muestraId).subscribe({
      next: (res) => this.diagnostico = res.data || null,
      error: () => {}
    });
  }

  generarDiagnostico() {
    this.generando = true;
    this.diagnosticosService.generar(this.muestraId).subscribe({
      next: (res) => { this.diagnostico = res.data || null; this.generando = false; },
      error: (err) => { this.errorMsg = err.error?.message || 'Error al generar diagnóstico'; this.generando = false; }
    });
  }

  get riesgoClass(): string {
    const map: any = { alto: 'red', moderado: 'amber', bajo: 'green' };
    return map[this.diagnostico?.resultado?.riesgo || ''] || 'gray';
  }
}
