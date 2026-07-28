import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { FertilizacionResponse, FertilizacionPreview } from '../models/fertilizacion.model';

@Injectable({ providedIn: 'root' })
export class FertilizacionService {
  constructor(private api: ApiService) {}

  /** Lectura rápida de suelo y clima, sin llamar a la IA ni guardar nada. */
  preview(parcelaId: string): Observable<ApiResponse<FertilizacionPreview>> {
    return this.api.get<ApiResponse<FertilizacionPreview>>(
      `${endpoint.FERTILIZACION_PARCELA}/${parcelaId}/preview`
    );
  }

  /** Genera y guarda un plan nuevo. */
  generar(parcelaId: string, soloReglas = false): Observable<ApiResponse<FertilizacionResponse>> {
    const query = soloReglas ? '?reglas=true' : '';
    return this.api.post<ApiResponse<FertilizacionResponse>>(
      `${endpoint.FERTILIZACION_GENERAR}/${parcelaId}${query}`
    );
  }

  /** Último plan guardado de la parcela. */
  ultimo(parcelaId: string): Observable<ApiResponse<FertilizacionResponse>> {
    return this.api.get<ApiResponse<FertilizacionResponse>>(
      `${endpoint.FERTILIZACION_PARCELA}/${parcelaId}`
    );
  }

  historial(parcelaId: string): Observable<ApiResponse<FertilizacionResponse[]>> {
    return this.api.get<ApiResponse<FertilizacionResponse[]>>(
      `${endpoint.FERTILIZACION_PARCELA}/${parcelaId}/historial`
    );
  }
}
