import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { Plan, Suscripcion } from '../models/suscripcion.model';

@Injectable({ providedIn: 'root' })
export class SuscripcionesService {
  constructor(private api: ApiService) {}

  obtenerPlanes(): Observable<ApiResponse<Plan[]>> {
    return this.api.get<ApiResponse<Plan[]>>(endpoint.PLANES);
  }

  suscribirse(planCodigo: string): Observable<ApiResponse<Suscripcion>> {
    return this.api.post<ApiResponse<Suscripcion>>(endpoint.SUSCRIPCIONES, { plan: planCodigo });
  }

  suscripcionActual(): Observable<ApiResponse<Suscripcion>> {
    return this.api.get<ApiResponse<Suscripcion>>(endpoint.SUSCRIPCIONES_ACTUAL);
  }

  cambiarPlan(planCodigo: string): Observable<ApiResponse<Suscripcion>> {
    return this.api.put<ApiResponse<Suscripcion>>(endpoint.SUSCRIPCIONES_CAMBIAR, { plan: planCodigo });
  }
}
