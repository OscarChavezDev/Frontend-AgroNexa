import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export const endpoint = {
  // AUTH
  AUTH_REGISTER:            'auth/register',
  AUTH_LOGIN:               'auth/login',
  AUTH_GOOGLE:              'auth/google',
  AUTH_CHECK_EMAIL:         'auth/check-email',
  AUTH_ME:                  'auth/me',


  // USUARIOS
  USERS_ME:                 'users/me',
  USERS_LIST:               'users',
  USERS_BY_ID:              'users',          // + /{id}
  USERS_STATUS:             'users',          // + /{id}/status

  // ADMIN
  ADMIN_USUARIOS:           'admin/usuarios',
  ADMIN_USUARIO_BY_ID:      'admin/usuarios', // + /{id}
  ADMIN_USUARIO_ESTADO:     'admin/usuarios', // + /{id}/estado
  ADMIN_ESTADISTICAS:       'admin/estadisticas',
  ADMIN_ACTIVIDAD_TEMPORAL: 'admin/estadisticas/actividad',
  ADMIN_USUARIO_HISTORIAL:  'admin/usuarios',   // + /{id}/historial
  ADMIN_SESIONES:           'admin/sesiones',

  // PARCELAS
  PARCELAS:                 'parcelas',
  PARCELA_BY_ID:            'parcelas',       // + /{id}
  PARCELA_MUESTRAS:         'parcelas',       // + /{id}/muestras

  // MUESTRAS
  MUESTRAS:                 'muestras',
  MUESTRA_BY_ID:            'muestras',       // + /{id}
  MUESTRA_DIAGNOSTICO:      'muestras',       // + /{id}/diagnostico
  MUESTRA_IMAGENES:         'muestras',       // + /{id}/imagenes

  // DIAGNÓSTICOS
  DIAGNOSTICOS_GENERAR:     'diagnosticos/generar',   // + /{muestraId}
  DIAGNOSTICOS_REGENERAR:   'diagnosticos/regenerar', // + /{muestraId}
  DIAGNOSTICO_BY_ID:        'diagnosticos',            // + /{id}

  // IMÁGENES
  IMAGENES_UPLOAD:          'imagenes/upload',
  IMAGENES_VALIDAR:         'imagenes/validar',
  IMAGEN_BY_ID:             'imagenes',       // + /{id}

  // CLIMA
  CLIMA:                    'clima',
  CLIMA_PARCELA:            'clima/parcela',           // + /{parcelaId}

  // FERTILIZACIÓN
  FERTILIZACION_GENERAR:    'fertilizacion/generar',   // + /{parcelaId}
  FERTILIZACION_PARCELA:    'fertilizacion/parcela',   // + /{parcelaId}
  FERTILIZACION_BY_ID:      'fertilizacion',           // + /{id}

  // SUSCRIPCIONES
  PLANES:                   'planes',
  SUSCRIPCIONES:            'suscripciones',
  SUSCRIPCIONES_ACTUAL:     'suscripciones/actual',
  SUSCRIPCIONES_CAMBIAR:    'suscripciones/cambiar-plan',

  // CONFIG
  CONFIG_MAPS:              'config/maps',
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = `${environment.apiUrl}/`;

  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.base + path);
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<T>(this.base + path, body);
  }

  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<T>(this.base + path, body);
  }

  delete<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.http.delete<T>(this.base + path, { params });
  }

  postFormData<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(this.base + path, formData);
  }
}
