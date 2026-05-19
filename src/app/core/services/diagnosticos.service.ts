import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { Diagnostico } from '../models/diagnostico.model';

@Injectable({ providedIn: 'root' })
export class DiagnosticosService {
  constructor(private api: ApiService) {}

  generar(muestraId: string): Observable<ApiResponse<Diagnostico>> {
    return this.api.post<ApiResponse<Diagnostico>>(`${endpoint.DIAGNOSTICOS_GENERAR}/${muestraId}`);
  }

  obtener(id: string): Observable<ApiResponse<Diagnostico>> {
    return this.api.get<ApiResponse<Diagnostico>>(`${endpoint.DIAGNOSTICO_BY_ID}/${id}`);
  }
}
