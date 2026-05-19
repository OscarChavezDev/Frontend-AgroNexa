import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ParcelasService } from '../../core/services/parcelas.service';
import { MuestrasService } from '../../core/services/muestras.service';
import { User } from '../../core/models/user.model';
import { Parcela } from '../../core/models/parcela.model';
import { Muestra } from '../../core/models/muestra.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  parcelas: Parcela[] = [];
  muestras: Muestra[] = [];
  loadingParcelas = true;
  loadingMuestras = true;

  constructor(
    private authService: AuthService,
    private parcelasService: ParcelasService,
    private muestrasService: MuestrasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.authService.currentUser;
    this.parcelasService.listar().subscribe({
      next: (res) => { 
        console.log('Respuesta del backend (Dashboard Parcelas):', res);
        this.parcelas = res.data || []; 
        this.loadingParcelas = false; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error (Dashboard Parcelas):', err);
        this.loadingParcelas = false;
        this.cdr.detectChanges();
      }
    });
    this.muestrasService.listar().subscribe({
      next: (res) => { 
        console.log('Respuesta del backend (Dashboard Muestras):', res);
        this.muestras = res.data || []; 
        this.loadingMuestras = false; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error (Dashboard Muestras):', err);
        this.loadingMuestras = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalParcelas() { return this.parcelas.length; }
  get totalMuestras() { return this.muestras.length; }
  get parcelasActivas() { return this.parcelas.filter(p => p.estado === 'activo').length; }

  get ultimasMuestras(): Muestra[] {
    return [...this.muestras].sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    ).slice(0, 5);
  }
}
