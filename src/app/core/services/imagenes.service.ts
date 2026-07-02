import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { ImagenMuestra } from '../models/muestra.model';

@Injectable({ providedIn: 'root' })
export class ImagenesService {
  constructor(private api: ApiService) {}

  subir(muestraId: string, file: File, tipoImagen?: string, descripcion?: string): Observable<ApiResponse<ImagenMuestra>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('muestraId', muestraId);
    if (tipoImagen) formData.append('tipoImagen', tipoImagen);
    if (descripcion) formData.append('descripcion', descripcion);
    return this.api.postFormData<ApiResponse<ImagenMuestra>>(endpoint.IMAGENES_UPLOAD, formData);
  }

  listarPorMuestra(muestraId: string): Observable<ApiResponse<ImagenMuestra[]>> {
    return this.api.get<ApiResponse<ImagenMuestra[]>>(`${endpoint.MUESTRA_IMAGENES}/${muestraId}/imagenes`);
  }

  eliminar(id: string, muestraId: string): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`${endpoint.IMAGEN_BY_ID}/${id}`, { muestraId });
  }

  validar(file: File): Observable<ApiResponse<{ relevante: boolean; motivo: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postFormData<ApiResponse<{ relevante: boolean; motivo: string }>>(endpoint.IMAGENES_VALIDAR, formData);
  }
}
