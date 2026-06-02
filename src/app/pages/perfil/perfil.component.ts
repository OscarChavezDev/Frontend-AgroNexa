import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  standalone: false
})
export class PerfilComponent implements OnInit {
  form: FormGroup;
  passwordForm: FormGroup;
  user: User | null = null;
  saving = false;
  mensaje = '';
  errorMsg = '';

  passwordSaving = false;
  passwordMensaje = '';
  passwordErrorMsg = '';

  showPasswordActual = false;
  showPasswordNueva = false;
  showPasswordConfirm = false;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['', Validators.pattern('^$|^[0-9]{9}$')]
    });

    this.passwordForm = this.fb.group({
      passwordActual: ['', [Validators.required, Validators.minLength(6)]],
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(g: FormGroup) {
    const nueva = g.get('passwordNueva')?.value;
    const confirm = g.get('passwordConfirm')?.value;
    return nueva === confirm ? null : { mismatch: true };
  }

  ngOnInit() {
    this.user = this.authService.currentUser;
    if (this.user) {
      this.form.patchValue({
        nombre:   this.user.nombre,
        apellido: this.user.apellido,
        telefono: this.user.telefono
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.mensaje = '';
    this.errorMsg = '';
    this.cdr.detectChanges();
    this.usersService.actualizarPerfil(this.form.value).subscribe({
      next: () => {
        this.mensaje = 'Perfil actualizado correctamente';
        this.saving = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.mensaje = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al guardar';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPasswordSubmit() {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.passwordSaving = true;
    this.passwordMensaje = '';
    this.passwordErrorMsg = '';
    this.cdr.detectChanges();

    const { passwordActual, passwordNueva } = this.passwordForm.value;
    this.usersService.cambiarPassword(passwordActual, passwordNueva).subscribe({
      next: () => {
        this.passwordMensaje = 'Contraseña actualizada correctamente';
        this.passwordSaving = false;
        this.passwordForm.reset();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.passwordMensaje = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.passwordErrorMsg = err.error?.message || 'Error al cambiar la contraseña';
        this.passwordSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  soloDigitos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/[^0-9]/g, '').slice(0, 9);
    input.value = limpio;
    this.form.get('telefono')?.setValue(limpio, { emitEvent: false });
  }

  get f() { return this.form.controls; }
  get pf() { return this.passwordForm.controls; }

  get iniciales(): string {
    return `${this.user?.nombre?.[0] || ''}${this.user?.apellido?.[0] || ''}`.toUpperCase();
  }

  get rolLabel(): string {
    const map: Record<string, string> = {
      productor:  '🌾 Productor',
      asociacion: '🤝 Asociación',
      institucion:'🏛️ Institución',
      admin:      '⚙️ Administrador',
    };
    return map[this.user?.rol || ''] || (this.user?.rol || '');
  }
}
