import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';

export interface AdminStats {
  usuarios: { total: number; activos: number; inactivos: number };
  parcelas: number;
  muestras: number;
  diagnosticos: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  obtenerEstadisticas(): Observable<ApiResponse<AdminStats>> {
    return this.api.get<ApiResponse<AdminStats>>(endpoint.ADMIN_ESTADISTICAS);
  }

  obtenerActividadTemporal(): Observable<ApiResponse<ActividadTemporal>> {
    return this.api.get<ApiResponse<ActividadTemporal>>(endpoint.ADMIN_ACTIVIDAD_TEMPORAL);
  }

  listarUsuarios(filtros?: { rol?: string; estado?: string }): Observable<ApiResponse<User[]>> {
    let path = endpoint.ADMIN_USUARIOS;
    const params: string[] = [];
    if (filtros?.rol) params.push(`rol=${filtros.rol}`);
    if (filtros?.estado) params.push(`estado=${filtros.estado}`);
    if (params.length) path += '?' + params.join('&');
    return this.api.get<ApiResponse<User[]>>(path);
  }

  obtenerUsuario(id: string): Observable<ApiResponse<User>> {
    return this.api.get<ApiResponse<User>>(`${endpoint.ADMIN_USUARIO_BY_ID}/${id}`);
  }

  cambiarEstado(id: string, estado: string): Observable<ApiResponse<{ id: string }>> {
    return this.api.put<ApiResponse<{ id: string }>>(`${endpoint.ADMIN_USUARIO_ESTADO}/${id}/estado`, { estado });
  }

  eliminarUsuario(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.api.delete<ApiResponse<{ id: string }>>(`${endpoint.ADMIN_USUARIO_BY_ID}/${id}`);
  }

  parcelasUsuario(userId: string): Observable<ApiResponse<any[]>> {
    return this.api.get<ApiResponse<any[]>>(`${endpoint.ADMIN_USUARIO_BY_ID}/${userId}/parcelas`);
  }

  historialUsuario(userId: string): Observable<ApiResponse<HistorialEntry[]>> {
    return this.api.get<ApiResponse<HistorialEntry[]>>(`${endpoint.ADMIN_USUARIO_HISTORIAL}/${userId}/historial`);
  }
  listarSesiones(): Observable<ApiResponse<ReingresoEntry[]>> {
    return this.api.get<ApiResponse<ReingresoEntry[]>>(endpoint.ADMIN_SESIONES);
  }
}

export interface HistorialEntry {
  tipo:   string;
  fecha:  string;
  motivo: string;
}

export interface ActividadTemporal {
  porDia:     { dia: string; count: number }[];
  porMes:     { mes: string; count: number }[];
  registros:  { fecha: string; count: number }[];
}

export interface ReingresoEntry {
  userId:             string;
  nombre:             string;
  apellido:           string;
  correo:             string;
  rol:                string;
  fecha:              string;
  fechaInactivacion:  string | null;
  diasInactivo:       number | null;  // puede ser decimal (ej: 0.5 = 12 horas)
  motivo:             string;
}
