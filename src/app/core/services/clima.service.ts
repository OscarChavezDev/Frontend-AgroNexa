import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { Clima } from '../models/clima.model';

@Injectable({ providedIn: 'root' })
export class ClimaService {
  constructor(private api: ApiService) {}

  porParcela(parcelaId: string, dias = 7): Observable<ApiResponse<Clima>> {
    return this.api.get<ApiResponse<Clima>>(
      `${endpoint.CLIMA_PARCELA}/${parcelaId}?dias=${dias}`
    );
  }

  porCoordenadas(lat: number, lng: number, dias = 7): Observable<ApiResponse<Clima>> {
    return this.api.get<ApiResponse<Clima>>(
      `${endpoint.CLIMA}?lat=${lat}&lng=${lng}&dias=${dias}`
    );
  }
}
