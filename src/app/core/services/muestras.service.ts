import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { Muestra, ImagenMuestra } from '../models/muestra.model';
import { Diagnostico } from '../models/diagnostico.model';

@Injectable({ providedIn: 'root' })
export class MuestrasService {
  constructor(private api: ApiService) {}

  listar(): Observable<ApiResponse<Muestra[]>> {
    return this.api.get<ApiResponse<Muestra[]>>(endpoint.MUESTRAS);
  }

  listarPorParcela(parcelaId: string): Observable<ApiResponse<Muestra[]>> {
    return this.api.get<ApiResponse<Muestra[]>>(`${endpoint.PARCELA_MUESTRAS}/${parcelaId}/muestras`);
  }

  obtener(id: string): Observable<ApiResponse<Muestra>> {
    return this.api.get<ApiResponse<Muestra>>(`${endpoint.MUESTRA_BY_ID}/${id}`);
  }

  crear(muestra: Partial<Muestra>): Observable<ApiResponse<{ id: string }>> {
    return this.api.post<ApiResponse<{ id: string }>>(endpoint.MUESTRAS, muestra);
  }

  actualizar(id: string, muestra: Partial<Muestra>): Observable<ApiResponse<Muestra>> {
    return this.api.put<ApiResponse<Muestra>>(`${endpoint.MUESTRA_BY_ID}/${id}`, muestra);
  }

  eliminar(id: string): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`${endpoint.MUESTRA_BY_ID}/${id}`);
  }

  obtenerDiagnostico(id: string): Observable<ApiResponse<Diagnostico>> {
    return this.api.get<ApiResponse<Diagnostico>>(`${endpoint.MUESTRA_DIAGNOSTICO}/${id}/diagnostico`);
  }

  listarImagenes(id: string): Observable<ApiResponse<ImagenMuestra[]>> {
    return this.api.get<ApiResponse<ImagenMuestra[]>>(`${endpoint.MUESTRA_IMAGENES}/${id}/imagenes`);
  }
}
