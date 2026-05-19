import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor(private muestrasService: MuestrasService) {}

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
        this.errorMsg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }
    }, 5000);

    this.sub = this.muestrasService.listar().subscribe({
      next: (res) => { clearTimeout(this.timeout); this.muestras = res.data || []; this.loading = false; },
      error: () => { clearTimeout(this.timeout); this.errorMsg = 'Error al cargar muestras'; this.loading = false; }
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
