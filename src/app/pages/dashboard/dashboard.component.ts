import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getCultivoOption } from '../../core/constants/cultivos';
import { Muestra } from '../../core/models/muestra.model';
import { Parcela } from '../../core/models/parcela.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { MensajesService } from '../../core/services/mensajes.service';
import { MuestrasService } from '../../core/services/muestras.service';
import { ParcelasService } from '../../core/services/parcelas.service';

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
  mostrarMensajeReingreso = false;

  feedbackAbierto = false;
  feedbackTexto = '';
  feedbackEnviando = false;
  feedbackEnviado = false;

  constructor(
    private authService: AuthService,
    private parcelasService: ParcelasService,
    private muestrasService: MuestrasService,
    private mensajesService: MensajesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  abrirFeedback() {
    this.feedbackAbierto = true;
  }

  cerrarFeedback() {
    this.feedbackAbierto = false;
    this.feedbackTexto = '';
    this.feedbackEnviado = false;
  }

  enviarFeedback() {
    if (!this.feedbackTexto.trim()) return;

    this.feedbackEnviando = true;
    this.mensajesService.enviar(this.feedbackTexto).subscribe({
      next: () => {
        this.feedbackEnviado = true;
        this.feedbackEnviando = false;
        this.feedbackTexto = '';
        this.cdr.detectChanges();
        setTimeout(() => this.cerrarFeedback(), 2000);
      },
      error: () => {
        this.feedbackEnviando = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit() {
    this.user = this.authService.currentUser;
    if (this.user?.rol === 'admin') {
      this.router.navigate(['/admin']);
      return;
    }

    this.mostrarMensajeReingreso = localStorage.getItem('agro_welcome_back') === 'true';
    if (this.mostrarMensajeReingreso) {
      localStorage.removeItem('agro_welcome_back');
    }

    this.parcelasService.listar().subscribe({
      next: (response) => {
        this.parcelas = response.data || [];
        this.loadingParcelas = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error (Dashboard Parcelas):', error);
        this.loadingParcelas = false;
        this.cdr.detectChanges();
      }
    });

    this.muestrasService.listar().subscribe({
      next: (response) => {
        this.muestras = response.data || [];
        this.loadingMuestras = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error (Dashboard Muestras):', error);
        this.loadingMuestras = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalParcelas() {
    return this.parcelas.length;
  }

  get totalMuestras() {
    return this.muestras.length;
  }

  get totalDiagnosticos() {
    return this.muestras.filter((muestra) => muestra.estado === 'diagnosticado').length;
  }

  getCultivoMeta(cultivo?: string | null) {
    return getCultivoOption(cultivo);
  }

  getParcelaResumen(parcela: Parcela): string {
    const parts = [this.getCultivoMeta(parcela.cultivo).label];
    const area = this.formatArea(parcela);

    if (area) {
      parts.push(area);
    } else if (parcela.referencia) {
      parts.push(parcela.referencia);
    }

    return parts.join(' - ');
  }

  cerrarMensajeReingreso() {
    this.mostrarMensajeReingreso = false;
  }

  get ultimasMuestras(): Muestra[] {
    return [...this.muestras]
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 5);
  }

  private formatArea(parcela: Parcela): string {
    const area = Number(parcela.areaAproximada);

    if (!Number.isFinite(area) || area <= 0) {
      return '';
    }

    return `${area} ${parcela.unidadArea || ''}`.trim();
  }
}
