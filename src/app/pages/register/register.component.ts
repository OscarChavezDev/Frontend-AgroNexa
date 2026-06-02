import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OnboardingService } from '../../core/services/onboarding.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  showPassword = false;

  roles = [
    { value: 'productor',  icon: '🌾', label: 'Productor',   desc: 'Agricultor individual' },
    { value: 'asociacion', icon: '🤝', label: 'Asociación',  desc: 'Grupo de productores' },
    { value: 'institucion',icon: '🏛️', label: 'Institución', desc: 'Entidad técnica o educativa' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private onboarding: OnboardingService,
    private router: Router,
    private cdr: ChangeDetectorRef
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

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.successMsg = 'Cuenta creada. Redirigiendo al login…';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al crear la cuenta';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get f() { return this.form.controls; }
}
