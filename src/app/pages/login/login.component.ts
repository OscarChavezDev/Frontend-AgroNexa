import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        try {
          const rol = res.data?.rol;
          if (rol === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } catch (e) {
          console.error('Error handling login response:', e);
          this.errorMsg = 'Error al procesar la sesión';
          this.loading = false;
        } finally {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Credenciales incorrectas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get f() { return this.form.controls; }
}
