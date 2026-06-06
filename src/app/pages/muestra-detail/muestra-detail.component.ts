import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MuestrasService } from '../../core/services/muestras.service';
import { ImagenesService } from '../../core/services/imagenes.service';
import { Muestra, ImagenMuestra } from '../../core/models/muestra.model';

@Component({
  selector: 'app-muestra-detail',
  templateUrl: './muestra-detail.component.html',
  styleUrls: ['./muestra-detail.component.scss'],
  standalone: false
})
export class MuestraDetailComponent implements OnInit {
  muestra: Muestra | null = null;
  imagenes: ImagenMuestra[] = [];
  loading = true;
  errorMsg = '';
  muestraId = '';
  tieneDiagnostico = false;

  constructor(
    private route: ActivatedRoute,
    private muestrasService: MuestrasService,
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
  }

  cargar() {
    this.loading = true;
    this.cdr.detectChanges();
    this.muestrasService.obtener(this.muestraId).subscribe({
      next: (res) => {
        this.muestra = res.data || null;
        this.loading = false;
        this.cargarImagenes();
        this.verificarDiagnostico();
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

  /** Consulta si ya existe un diagnóstico para mostrar el badge correcto en el botón */
  verificarDiagnostico() {
    this.muestrasService.obtenerDiagnostico(this.muestraId).subscribe({
      next: (res) => {
        const data = res.data as any;
        // Tiene diagnóstico si no es null y está en estado completado
        this.tieneDiagnostico = !!(data && !('diagnostico' in data && data.diagnostico === null) && data?.estado === 'completado');
        this.cdr.detectChanges();
      },
      error: () => {
        this.tieneDiagnostico = false;
        this.cdr.detectChanges();
      }
    });
  }
}
