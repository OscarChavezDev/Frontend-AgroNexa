import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SuscripcionesService } from '../../core/services/suscripciones.service';
import { Plan, Suscripcion } from '../../core/models/suscripcion.model';
import { MensajesService } from '../../core/services/mensajes.service';
import { PopupService } from '../../shared/services/popup.service';


@Component({
  selector: 'app-planes',
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.scss'],
  standalone: false
})
export class PlanesComponent implements OnInit {
  planes: Plan[] = [];
  suscripcionActual: Suscripcion | null = null;
  planesInteresados: Set<string> = new Set();
  loading = true;
  procesando = '';
  mensaje = '';

  constructor(
    private suscripcionesService: SuscripcionesService,
    private mensajesService: MensajesService,
    private popupService: PopupService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
    const guardados = localStorage.getItem('planes_interesados');
    if (guardados) {
      this.planesInteresados = new Set(JSON.parse(guardados));
    }
  }

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
    if (plan.codigo === 'asociacion' || plan.codigo === 'institucional') {
      this.procesando = plan.codigo;
      this.cdr.detectChanges();
      
      const texto = `Hola, estoy interesado en el plan ${plan.nombre}. Me gustaría recibir más información.`;
      
      this.mensajesService.enviar(texto).subscribe({
        next: () => {
          this.planesInteresados.add(plan.codigo);
          localStorage.setItem('planes_interesados', JSON.stringify(Array.from(this.planesInteresados)));
          this.popupService.success('Mensaje enviado', 'Pronto nos pondremos en contacto contigo.');
          this.procesando = '';
          this.cdr.detectChanges();
        },
        error: () => {
          this.popupService.error('Error', 'No se pudo enviar el mensaje. Intenta más tarde.');
          this.procesando = '';
          this.cdr.detectChanges();
        }
      });
      return;
    }

    if (!confirm(`¿Suscribirse al plan ${plan.nombre}?`)) return;
    this.procesando = plan.codigo;
    this.cdr.detectChanges();
    this.suscripcionesService.suscribirse(plan.codigo).subscribe({
      next: (res) => {
        this.suscripcionActual = res.data || null;
        this.popupService.success('¡Plan Activado!', `El plan ${plan.nombre} se activó correctamente.`);
        this.procesando = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.popupService.error('Error', err.error?.message || 'Error al cambiar plan');
        this.procesando = '';
        this.cdr.detectChanges();
      }
    });
  }

  esInteresado(codigo: string): boolean {
    return this.planesInteresados.has(codigo);
  }

  esPlanActual(codigo: string): boolean {
    return this.suscripcionActual?.plan === codigo;
  }
}
