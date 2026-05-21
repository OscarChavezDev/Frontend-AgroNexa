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
}
