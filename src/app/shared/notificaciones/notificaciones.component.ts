import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { MensajesService, Mensaje } from '../../core/services/mensajes.service';
import { AuthService } from '../../core/services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector:    'app-notificaciones',
  templateUrl: './notificaciones.component.html',
  styleUrls:   ['./notificaciones.component.scss'],
  standalone:  false
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  abierto       = false;
  mensajes:    Mensaje[] = [];
  noLeidos     = 0;
  cargando     = false;
  private poll?: Subscription;

  get isAdmin(): boolean { return this.auth.isAdmin; }

  constructor(
    private svc: MensajesService,
    readonly auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.auth.isAdmin) {
      this.cargarConteo();
      // Polling cada 30 s para actualizar el badge
      this.poll = interval(30_000).subscribe(() => this.cargarConteo());
    }
  }

  ngOnDestroy() { this.poll?.unsubscribe(); }

  cargarConteo() {
    this.svc.conteo().subscribe({
      next: (r) => { this.noLeidos = r.data?.noLeidos ?? 0; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  toggle() {
    this.abierto = !this.abierto;
    if (this.abierto && !this.mensajes.length) this.cargarMensajes();
  }

  cargarMensajes() {
    this.cargando = true;
    this.svc.listar().subscribe({
      next: (r) => {
        this.mensajes = r.data || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  leerTodos() {
    this.svc.marcarTodosLeidos().subscribe({
      next: () => {
        this.mensajes = this.mensajes.map(m => ({ ...m, leido: true }));
        this.noLeidos = 0;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  leer(m: Mensaje) {
    if (m.leido) return;
    this.svc.marcarLeido(m.id).subscribe({
      next: () => {
        m.leido = true;
        this.noLeidos = Math.max(0, this.noLeidos - 1);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  tipoLabel(tipo: string): string {
    return tipo === 'reingreso' ? 'Reingreso' : 'Recomendación';
  }

  tipoClass(tipo: string): string {
    return tipo === 'reingreso' ? 'notif-chip--teal' : 'notif-chip--green';
  }

  @HostListener('document:click', ['$event'])
  onClickFuera(e: MouseEvent) {
    const el = (e.target as HTMLElement).closest('.notif-wrapper');
    if (!el) this.abierto = false;
  }
}
