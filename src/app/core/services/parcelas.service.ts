import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { Parcela } from '../models/parcela.model';
import { Muestra } from '../models/muestra.model';

@Injectable({ providedIn: 'root' })
export class ParcelasService {
  constructor(private api: ApiService) {}

  listar(): Observable<ApiResponse<Parcela[]>> {
    return this.api.get<ApiResponse<Parcela[]>>(endpoint.PARCELAS);
  }

  obtener(id: string): Observable<ApiResponse<Parcela>> {
    return this.api.get<ApiResponse<Parcela>>(`${endpoint.PARCELA_BY_ID}/${id}`);
  }

  crear(parcela: Partial<Parcela>): Observable<ApiResponse<{ id: string }>> {
    return this.api.post<ApiResponse<{ id: string }>>(endpoint.PARCELAS, parcela);
  }

  actualizar(id: string, parcela: Partial<Parcela>): Observable<ApiResponse<Parcela>> {
    return this.api.put<ApiResponse<Parcela>>(`${endpoint.PARCELA_BY_ID}/${id}`, parcela);
  }

  eliminar(id: string): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`${endpoint.PARCELA_BY_ID}/${id}`);
  }

  listarMuestras(id: string): Observable<ApiResponse<Muestra[]>> {
    return this.api.get<ApiResponse<Muestra[]>>(`${endpoint.PARCELA_MUESTRAS}/${id}/muestras`);
  }
}
