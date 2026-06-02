import {
  Component, OnInit, OnDestroy, NgZone,
  ChangeDetectorRef, HostListener
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { OnboardingService, OnboardingStep } from '../../core/services/onboarding.service';

interface Rect { top: number; left: number; width: number; height: number; }
interface TPos { top?: string; left?: string; }

@Component({
  selector: 'app-onboarding-overlay',
  templateUrl: './onboarding-overlay.component.html',
  styleUrls: ['./onboarding-overlay.component.scss'],
  standalone: false
})
export class OnboardingOverlayComponent implements OnInit, OnDestroy {
  isVisible = false;
  currentStep: OnboardingStep | null = null;
  isModal = false;
  tooltipReady = false;
  spotlight: Rect = { top: 0, left: 0, width: 0, height: 0 };
  tooltipPos: TPos = {};

  private subs = new Subscription();
  private targetEl: Element | null = null;
  private targetClickFn: (() => void) | null = null;
  private findTimer: any = null;
  private findRetries = 0;

  constructor(
    private onboarding: OnboardingService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.onboarding.currentStepIndex$.subscribe(index => {
        this.currentStep = this.onboarding.currentStep;
        this.isVisible = index >= 0;
        this.isModal = !this.currentStep ||
          this.currentStep.id === 'welcome' ||
          this.currentStep.id === 'complete';
        this.tooltipReady = false;
        this.clearTarget();
        this.updateBlocker();
        if (this.isVisible && this.currentStep?.targetSelector) {
          this.scheduleHighlight(this.currentStep);
        }
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => {
          const step = this.onboarding.currentStep;
          if (!step || !this.isVisible) return;
          const url: string = e.urlAfterRedirects.split('?')[0];

          if (step.advanceOnPattern?.test(url)) {
            setTimeout(() => this.ngZone.run(() => this.onboarding.advance()), 200);
            return;
          }
          if (step.targetSelector && step.showOnPattern.test(url)) {
            this.scheduleHighlight(step);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.clearTarget();
    this.removeBlocker();
    clearTimeout(this.findTimer);
  }

  get progressLabel(): string { return this.onboarding.progressLabel; }

  // ── Click blocker (capture phase) ───────────────────────────
  private blockFn = (e: MouseEvent): void => {
    const step = this.onboarding.currentStep;
    if (!step) return;
    // Form steps: let the user fill freely
    if (step.nextAction === 'navigate') return;

    const t = e.target as Node;
    const tooltip = document.querySelector('.ob-tooltip, .ob-modal');
    if (tooltip?.contains(t)) return;
    if (this.targetEl?.contains(t)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  private updateBlocker(): void {
    this.removeBlocker();
    if (this.isVisible) document.addEventListener('click', this.blockFn, true);
  }

  private removeBlocker(): void {
    document.removeEventListener('click', this.blockFn, true);
  }
  // ────────────────────────────────────────────────────────────

  private scheduleHighlight(step: OnboardingStep): void {
    clearTimeout(this.findTimer);
    this.findRetries = 0;
    this.findTimer = setTimeout(() => this.tryHighlight(step), 400);
  }

  private tryHighlight(step: OnboardingStep): void {
    if (!step.targetSelector) return;
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      if (this.findRetries < 12) {
        this.findRetries++;
        this.findTimer = setTimeout(() => this.tryHighlight(step), 350);
      }
      return;
    }

    // Si el elemento está oculto (sidebar cerrada en móvil), abrirla primero
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      const menuBtn = document.querySelector('.menu-toggle') as HTMLElement;
      if (menuBtn && this.findRetries < 12) {
        menuBtn.click();
        this.findRetries++;
        this.findTimer = setTimeout(() => this.tryHighlight(step), 450);
      }
      return;
    }
    this.clearTarget();
    this.targetEl = el;
    el.classList.add('onboarding-target-active');

    const pad = 10;
    const r = el.getBoundingClientRect();
    this.spotlight = { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
    this.tooltipPos = this.calcPos(r, step.tooltipPosition || 'bottom');
    this.tooltipReady = true;

    if (step.nextAction === 'click') {
      this.targetClickFn = () => {
        this.ngZone.run(() => setTimeout(() => this.onboarding.advance(), 200));
      };
      el.addEventListener('click', this.targetClickFn as EventListener, { once: true });
    }
    this.cdr.detectChanges();
  }

  private calcPos(r: DOMRect, pos: string): TPos {
    const W = 310; const H = 190; const g = 18; const m = 12;
    const vw = window.innerWidth; const vh = window.innerHeight;
    switch (pos) {
      case 'right': return {
        top:  `${Math.max(m, Math.min(vh - H - m, r.top + r.height / 2 - H / 2))}px`,
        left: `${Math.min(r.right + g, vw - W - m)}px`
      };
      case 'left': return {
        top:  `${Math.max(m, Math.min(vh - H - m, r.top + r.height / 2 - H / 2))}px`,
        left: `${Math.max(m, r.left - W - g)}px`
      };
      case 'top': return {
        top:  `${Math.max(m, r.top - H - g)}px`,
        left: `${Math.max(m, Math.min(vw - W - m, r.left + r.width / 2 - W / 2))}px`
      };
      default: return { // bottom
        top:  `${Math.min(r.bottom + g, vh - H - m)}px`,
        left: `${Math.max(m, Math.min(vw - W - m, r.left + r.width / 2 - W / 2))}px`
      };
    }
  }

  private clearTarget(): void {
    clearTimeout(this.findTimer);
    if (this.targetEl) {
      this.targetEl.classList.remove('onboarding-target-active');
      if (this.targetClickFn) {
        this.targetEl.removeEventListener('click', this.targetClickFn as EventListener);
        this.targetClickFn = null;
      }
      this.targetEl = null;
    }
    this.spotlight = { top: 0, left: 0, width: 0, height: 0 };
    this.tooltipPos = {};
  }

  @HostListener('window:resize')
  onResize(): void {
    const step = this.onboarding.currentStep;
    if (step && this.targetEl) {
      const pad = 10; const r = this.targetEl.getBoundingClientRect();
      this.spotlight = { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
      this.tooltipPos = this.calcPos(r, step.tooltipPosition || 'bottom');
      this.cdr.detectChanges();
    }
  }

  onNext(): void { this.onboarding.advance(); }
  onSkip(): void { this.onboarding.skip(); }
}
