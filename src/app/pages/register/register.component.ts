import { Component, ChangeDetectorRef, AfterViewInit, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';

declare const google: any;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false
})
export class RegisterComponent implements AfterViewInit, OnInit {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  showPassword = false;
  currentStep = 1;
  isGoogleRoleMode = false;

  roles = [
    { value: 'productor',   icon: '🌾', label: 'Productor',    desc: 'Agricultor individual' },
    { value: 'asociacion',  icon: '🤝', label: 'Asociación',   desc: 'Grupo de productores' },
    { value: 'institucion', icon: '🏛️', label: 'Institución',  desc: 'Entidad técnica o educativa' },
  ];

  selectedPlan = 'basico';

  allPlans = [
    {
      codigo: 'basico',
      nombre: 'Plan Básico',
      precio: 0,
      badge: 'Gratis',
      trial: null,
      roles: ['productor', 'asociacion', 'institucion'],
      features: ['Hasta 2 parcelas', '3 muestras al mes', 'Orientación preliminar'],
    },
    {
      codigo: 'plus',
      nombre: 'Productor Plus',
      precio: 15,
      badge: 'S/. 15/mes',
      trial: '30 días gratis',
      roles: ['productor'],
      features: ['Parcelas ilimitadas', 'Muestras ilimitadas', 'Registro de imágenes', 'Alertas tempranas'],
    },
    {
      codigo: 'asociacion',
      nombre: 'Asociación',
      precio: 200,
      badge: 'S/. 200/mes',
      trial: '30 días gratis',
      roles: ['asociacion'],
      features: ['Panel multi-productor', 'Gestión de asociados', 'Reportes consolidados'],
    },
    {
      codigo: 'institucional',
      nombre: 'Institucional',
      precio: 350,
      badge: 'S/. 350/mes',
      trial: '30 días gratis',
      roles: ['institucion'],
      features: ['Monitoreo territorial', 'Panel institucional', 'Gestión por roles'],
    },
  ];

  get filteredPlans() {
    const rol = this.form.get('rol')?.value || 'productor';
    return this.allPlans.filter(p => p.roles.includes(rol));
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private analyticsService: AnalyticsService
  ) {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      apellido: ['', Validators.required],
      correo:   ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol:      ['productor', Validators.required]
    });
  }

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    if (mode === 'selectRole') {
      this.isGoogleRoleMode = true;
      this.currentStep = 3;
    }
  }

  ngAfterViewInit(): void {
    if (!this.isGoogleRoleMode) {
      this.waitForGoogleAndInit();
    }
  }

  private waitForGoogleAndInit(attempts = 0): void {
    if (typeof google !== 'undefined') {
      this.initializeGoogleSignIn();
    } else if (attempts < 20) {
      setTimeout(() => this.waitForGoogleAndInit(attempts + 1), 250);
    }
  }

  private initializeGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: '150252966514-r2cbcos1n2mhl871c3iu0ga2t1e9o5le.apps.googleusercontent.com',
      callback: (response: any) => this.ngZone.run(() => this.handleGoogleCredentialResponse(response))
    });

    const btn = document.getElementById('google-btn');
    if (btn) {
      google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large', width: 320, logo_alignment: 'left' });
    }
  }

  private handleGoogleCredentialResponse(response: any): void {
    const idToken = response.credential;
    this.loading = true;
    this.errorMsg = '';

    this.authService.loginWithGoogle(idToken).subscribe({
      next: (res) => {
        this.loading = false;
        const isNewUser = localStorage.getItem('google_new_user') === 'true';
        localStorage.removeItem('google_new_user');
        const rol = res.data?.rol;
        this.analyticsService.trackEvent('sign_up', { method: 'google', role: rol });

        if (isNewUser) {
          localStorage.setItem('agro_new_registration', 'true');
          this.isGoogleRoleMode = true;
          this.currentStep = 3;
          this.selectedPlan = 'basico';
        } else {
          if (rol === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al registrar con Google';
        this.loading = false;
      }
    });
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      this.form.get('nombre')?.markAsTouched();
      this.form.get('apellido')?.markAsTouched();
      if (this.form.get('nombre')?.invalid || this.form.get('apellido')?.invalid) return;
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      this.form.get('correo')?.markAsTouched();
      this.form.get('password')?.markAsTouched();
      if (this.form.get('correo')?.invalid || this.form.get('password')?.invalid) return;
      this.currentStep = 3;
    } else if (this.currentStep === 3 && this.isGoogleRoleMode) {
      // Reset plan to basico if the selected plan is no longer valid for new role
      const valid = this.filteredPlans.some(p => p.codigo === this.selectedPlan);
      if (!valid) this.selectedPlan = 'basico';
      this.currentStep = 4;
    }
    this.errorMsg = '';
  }

  prevStep(): void {
    if (this.isGoogleRoleMode && this.currentStep === 4) {
      this.currentStep = 3;
      this.errorMsg = '';
      return;
    }
    if (this.currentStep > 1 && !this.isGoogleRoleMode) {
      this.currentStep--;
      this.errorMsg = '';
    }
  }

  onSubmit(): void {
    if (this.isGoogleRoleMode) {
      // Step 3 (Google mode): go to plan selection
      if (this.currentStep === 3) {
        this.nextStep();
        return;
      }
      // Step 4 (Google mode): save role + subscribe to plan
      this.loading = true;
      this.errorMsg = '';
      this.authService.updateProfile({ rol: this.form.get('rol')?.value }).subscribe({
        next: () => {
          this.authService.subscribeToPlan(this.selectedPlan).subscribe({
            next: () => {
              this.loading = false;
              this.router.navigate(['/dashboard']);
            },
            error: () => {
              // Plan subscription failed — still navigate, user can change later
              this.loading = false;
              this.router.navigate(['/dashboard']);
            }
          });
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'Error al guardar tu perfil';
          this.loading = false;
        }
      });
      return;
    }

    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.analyticsService.trackEvent('sign_up', { method: 'email', role: this.form.value.rol });
        localStorage.setItem('agro_new_registration', 'true');
        this.successMsg = 'Cuenta creada. Redirigiendo al login…';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al crear la cuenta';
        this.loading = false;
      }
    });
  }

  get f() { return this.form.controls; }
}
