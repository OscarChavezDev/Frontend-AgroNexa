import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'agro_theme';
  private theme$ = new BehaviorSubject<Theme>(this.read());

  /** Tema actual como observable (para que la UI reaccione). */
  readonly current$ = this.theme$.asObservable();

  constructor() {
    // Aplica el tema guardado lo antes posible (al instanciarse el servicio).
    this.apply(this.theme$.value);
  }

  get current(): Theme {
    return this.theme$.value;
  }

  get isDark(): boolean {
    return this.theme$.value === 'dark';
  }

  toggle(): void {
    this.set(this.isDark ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.theme$.next(theme);
    try { localStorage.setItem(this.KEY, theme); } catch { /* ignore */ }
    this.apply(theme);
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /** Lee la preferencia guardada; por defecto oscuro. */
  private read(): Theme {
    try {
      const saved = localStorage.getItem(this.KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    return 'dark';
  }
}
