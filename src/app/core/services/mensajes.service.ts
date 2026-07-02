import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';

export interface Mensaje {
  id:       string;
  userId:   string;
  nombre:   string;
  apellido: string;
  correo:   string;
  tipo:     'feedback' | 'reingreso';
  mensaje:  string;
  leido:    boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class MensajesService {
  constructor(private api: ApiService) {}

  enviar(mensaje: string): Observable<ApiResponse<{ id: string }>> {
    return this.api.post<ApiResponse<{ id: string }>>('mensajes', { mensaje });
  }

  listar(): Observable<ApiResponse<Mensaje[]>> {
    return this.api.get<ApiResponse<Mensaje[]>>('mensajes');
  }

  conteo(): Observable<ApiResponse<{ noLeidos: number }>> {
    return this.api.get<ApiResponse<{ noLeidos: number }>>('mensajes/conteo');
  }

  marcarLeido(id: string): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(`mensajes/${id}/leer`);
  }

  marcarTodosLeidos(): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>('mensajes/leer-todos');
  }
}
