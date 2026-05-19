import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private api: ApiService) {}

  miPerfil(): Observable<ApiResponse<User>> {
    return this.api.get<ApiResponse<User>>(endpoint.USERS_ME);
  }

  actualizarPerfil(data: Partial<User>): Observable<ApiResponse<User>> {
    return this.api.put<ApiResponse<User>>(endpoint.USERS_ME, data);
  }

  listar(): Observable<ApiResponse<User[]>> {
    return this.api.get<ApiResponse<User[]>>(endpoint.USERS_LIST);
  }

  obtener(id: string): Observable<ApiResponse<User>> {
    return this.api.get<ApiResponse<User>>(`${endpoint.USERS_BY_ID}/${id}`);
  }

  cambiarEstado(id: string, estado: string): Observable<ApiResponse<User>> {
    return this.api.put<ApiResponse<User>>(`${endpoint.USERS_STATUS}/${id}/status`, { estado });
  }
}
