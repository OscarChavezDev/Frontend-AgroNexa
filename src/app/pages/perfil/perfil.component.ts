import { Component, OnInit } from '@angular/core';
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
  user: User | null = null;
  saving = false;
  mensaje = '';
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['']
    });
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
    this.usersService.actualizarPerfil(this.form.value).subscribe({
      next: () => {
        this.mensaje = 'Perfil actualizado correctamente';
        this.saving = false;
        setTimeout(() => this.mensaje = '', 3000);
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Error al guardar'; this.saving = false; }
    });
  }

  get f() { return this.form.controls; }

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
