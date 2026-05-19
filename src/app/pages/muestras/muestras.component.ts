import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { MuestrasService } from '../../core/services/muestras.service';
import { Muestra } from '../../core/models/muestra.model';

@Component({
  selector: 'app-muestras',
  templateUrl: './muestras.component.html',
  styleUrls: ['./muestras.component.scss'],
  standalone: false
})
export class MuestrasComponent implements OnInit, OnDestroy {
  muestras: Muestra[] = [];
  loading = true;
  errorMsg = '';

  private sub?: Subscription;
  private timeout?: ReturnType<typeof setTimeout>;

  constructor(
    private muestrasService: MuestrasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    clearTimeout(this.timeout);
  }

  cargar() {
    this.loading = true;
    this.errorMsg = '';
    this.sub?.unsubscribe();
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.errorMsg = 'No se pudo conectar con el servidor (Tiempo de espera agotado).';
        this.cdr.detectChanges();
      }
    }, 5000);

    this.sub = this.muestrasService.listar().subscribe({
      next: (res) => { 
        clearTimeout(this.timeout); 
        console.log('Respuesta del backend (Muestras):', res);
        this.muestras = res.data || []; 
        this.loading = false; 
        this.cdr.detectChanges();
      },
      error: (err) => { 
        clearTimeout(this.timeout); 
        console.error('Error al obtener muestras:', err);
        this.errorMsg = 'Error al cargar muestras'; 
        this.loading = false; 
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(id: string) {
    if (!confirm('¿Eliminar esta muestra?')) return;
    this.muestrasService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: () => alert('Error al eliminar')
    });
  }

  nivelClass(nivel: string | undefined): string {
    const map: any = { severo: 'red', moderado: 'amber', leve: 'green' };
    return map[nivel || ''] || 'gray';
  }
}
