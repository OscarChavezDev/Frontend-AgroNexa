import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface OnboardingStep {
  id: string;
  showOnPattern: RegExp;
  advanceOnPattern?: RegExp;
  targetSelector?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  title: string;
  description: string;
  nextAction: 'button' | 'navigate' | 'click';
  autoAdvanceMs?: number;
  hasFeedback?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    showOnPattern: /./,
    title: '¡Bienvenido a AgroNexa!',
    description: 'Te guiaremos para obtener tu primer diagnóstico agrícola con inteligencia artificial. ¡Es muy fácil!',
    nextAction: 'button'
  },
  {
    id: 'ir-parcelas',
    showOnPattern: /^\/dashboard/,
    advanceOnPattern: /^\/parcelas$/,
    targetSelector: '#onboarding-nav-parcelas',
    tooltipPosition: 'right',
    title: 'Paso 1 — Ve a Mis Parcelas',
    description: 'Haz clic en "Mis Parcelas" en el menú lateral para registrar tu primer terreno de cultivo.',
    nextAction: 'navigate'
  },
  {
    id: 'crear-parcela',
    showOnPattern: /^\/parcelas$/,
    advanceOnPattern: /^\/parcelas\/nueva/,
    targetSelector: '#onboarding-btn-nueva-parcela',
    tooltipPosition: 'bottom',
    title: 'Paso 2 — Crea tu primera parcela',
    description: 'Haz clic en "+ Nueva parcela" para registrar tu terreno con su nombre, cultivo y ubicación en el mapa.',
    nextAction: 'navigate'
  },
  {
    id: 'llenar-parcela',
    showOnPattern: /^\/parcelas\/nueva/,
    advanceOnPattern: /^\/parcelas$/,
    title: 'Paso 3 — Completa el formulario',
    description: 'Ingresa el nombre, selecciona el cultivo y marca la ubicación en el mapa. Cuando termines haz clic en "Registrar parcela" al final del formulario.',
    nextAction: 'navigate'
  },
  {
    id: 'ver-detalle',
    showOnPattern: /^\/parcelas$/,
    advanceOnPattern: /^\/parcelas\/(?!nueva)[^/]+$/,
    targetSelector: '.parcela-card__actions a.btn-outline-sm',
    tooltipPosition: 'bottom',
    title: 'Paso 4 — Abre tu parcela',
    description: '¡Parcela creada! Ahora haz clic en "Ver detalle" de la parcela que acabas de registrar.',
    nextAction: 'navigate'
  },
  {
    id: 'crear-muestra',
    showOnPattern: /^\/parcelas\/(?!nueva)[^/]+$/,
    advanceOnPattern: /^\/muestras\/nueva/,
    targetSelector: '#onboarding-btn-nueva-muestra',
    tooltipPosition: 'bottom',
    title: 'Paso 5 — Registra una muestra',
    description: 'Observa tu cultivo e identifica posibles problemas. Haz clic en "+ Nueva muestra" para registrar lo que ves.',
    nextAction: 'navigate'
  },
  {
    id: 'llenar-muestra',
    showOnPattern: /^\/muestras\/nueva/,
    advanceOnPattern: /^\/muestras\/(?!nueva)[^/]+/,
    title: 'Paso 6 — Describe los síntomas',
    description: 'Selecciona la parcela, indica la parte afectada, los síntomas que observas y el nivel de afectación. Luego haz clic en "Registrar muestra".',
    nextAction: 'navigate'
  },
  {
    id: 'diagnostico',
    showOnPattern: /^\/muestras\/(?!nueva)[^/]+/,
    targetSelector: '#onboarding-btn-generar-diagnostico',
    tooltipPosition: 'top',
    title: 'Paso 7 — ¡Obtén tu diagnóstico!',
    description: 'Haz clic en "Generar diagnóstico" para que la IA analice los síntomas y te dé recomendaciones personalizadas.',
    nextAction: 'navigate',
    autoAdvanceMs: 3000
  },
  {
    id: 'feedback',
    showOnPattern: /^\/muestras\/(?!nueva)[^/]+/,
    title: '¿Tienes alguna sugerencia?',
    description: 'Cuéntanos qué mejorarías o qué te ha parecido la plataforma. Tu opinión nos ayuda a crecer. (Opcional)',
    nextAction: 'button',
    hasFeedback: true
  },
  {
    id: 'complete',
    showOnPattern: /^\/muestras\/(?!nueva)[^/]+/,
    title: '¡Todo listo!',
    description: 'Has obtenido tu primer diagnóstico agrícola. Ahora puedes usar AgroNexa con total libertad para monitorear todos tus cultivos.',
    nextAction: 'button'
  }
];

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private stepIndex$ = new BehaviorSubject<number>(-1);
  currentStepIndex$ = this.stepIndex$.asObservable();

  // La clave incluye el ID del usuario para que cada cuenta tenga su propio estado
  private get doneKey(): string {
    try {
      const raw = localStorage.getItem('user');
      const id = raw ? JSON.parse(raw)?.id ?? 'x' : 'x';
      return `agro_onboarding_done_${id}`;
    } catch { return 'agro_onboarding_done_x'; }
  }

  get isActive(): boolean { return this.stepIndex$.value >= 0; }
  get currentStep(): OnboardingStep | null {
    const i = this.stepIndex$.value;
    return i >= 0 && i < ONBOARDING_STEPS.length ? ONBOARDING_STEPS[i] : null;
  }
  get currentIndex(): number { return this.stepIndex$.value; }

  get progressLabel(): string {
    const step = this.currentStep;
    if (!step || step.id === 'welcome' || step.id === 'complete') return '';
    const navSteps = ONBOARDING_STEPS.filter(s => s.id !== 'welcome' && s.id !== 'complete');
    const idx = navSteps.findIndex(s => s.id === step.id);
    return `${idx + 1} / ${navSteps.length}`;
  }

  checkAndStart(): void {
    if (this.isActive) return;
    if (localStorage.getItem(this.doneKey) === 'true') return;
    if (localStorage.getItem('agro_new_registration') !== 'true') return;
    localStorage.removeItem('agro_new_registration');
    this.stepIndex$.next(0);
  }

  advance(): void {
    const next = this.stepIndex$.value + 1;
    if (next >= ONBOARDING_STEPS.length) {
      this.complete();
    } else {
      this.stepIndex$.next(next);
    }
  }

  complete(): void {
    localStorage.setItem(this.doneKey, 'true');
    this.stepIndex$.next(-1);
  }

  skip(): void { this.complete(); }
}
