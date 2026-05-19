import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ParcelasService } from '../../core/services/parcelas.service';
import { Parcela } from '../../core/models/parcela.model';

@Component({
  selector: 'app-parcelas',
  templateUrl: './parcelas.component.html',
  styleUrls: ['./parcelas.component.scss'],
  standalone: false
})
export class ParcelasComponent implements OnInit, OnDestroy {
  parcelas: Parcela[] = [];
  loading = true;
  errorMsg = '';

  private sub?: Subscription;
  private timeout?: ReturnType<typeof setTimeout>;

  constructor(
    private parcelasService: ParcelasService,
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

    this.sub = this.parcelasService.listar().subscribe({
      next: (res) => { 
        clearTimeout(this.timeout); 
        console.log('Respuesta del backend (Parcelas):', res);
        this.parcelas = res.data || []; 
        this.loading = false; 
        this.cdr.detectChanges();
      },
      error: (err) => { 
        clearTimeout(this.timeout); 
        console.error('Error al obtener parcelas:', err);
        this.errorMsg = 'Error al cargar parcelas'; 
        this.loading = false; 
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar la parcela "${nombre}"?`)) return;
    this.parcelasService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: () => alert('Error al eliminar')
    });
  }
}
