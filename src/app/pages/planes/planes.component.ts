import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SuscripcionesService } from '../../core/services/suscripciones.service';
import { Plan, Suscripcion } from '../../core/models/suscripcion.model';

@Component({
  selector: 'app-planes',
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.scss'],
  standalone: false
})
export class PlanesComponent implements OnInit {
  planes: Plan[] = [];
  suscripcionActual: Suscripcion | null = null;
  loading = true;
  procesando = '';
  mensaje = '';

  constructor(
    private suscripcionesService: SuscripcionesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.suscripcionesService.obtenerPlanes().subscribe({
      next: (res) => { 
        console.log('Respuesta del backend (Planes):', res);
        this.planes = res.data || []; 
        this.loading = false; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener planes:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
    this.suscripcionesService.suscripcionActual().subscribe({
      next: (res) => {
        this.suscripcionActual = res.data || null;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  suscribirse(plan: Plan) {
    if (!confirm(`¿Suscribirse al plan ${plan.nombre}?`)) return;
    this.procesando = plan.codigo;
    this.suscripcionesService.suscribirse(plan.codigo).subscribe({
      next: (res) => {
        this.suscripcionActual = res.data || null;
        this.mensaje = `Plan ${plan.nombre} activado correctamente`;
        this.procesando = '';
        setTimeout(() => this.mensaje = '', 3000);
      },
      error: (err) => {
        this.mensaje = err.error?.message || 'Error al cambiar plan';
        this.procesando = '';
      }
    });
  }

  esPlanActual(codigo: string): boolean {
    return this.suscripcionActual?.plan === codigo;
  }
}
