import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { ImagenMuestra } from '../models/muestra.model';

export interface ResultadoValidacion {
  relevante: boolean;
  motivo: string;
  validado?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ImagenesService {
  /**
   * Lado máximo de la copia que se manda a validar.
   *
   * Solo hay que responder "¿es cacao?", y para eso 768 px sobran. Una foto de
   * celular de 4 MB baja a unos 80 KB: se sube ~50 veces más rápido y la IA
   * procesa muchos menos tokens de imagen. El archivo original NO se toca; se
   * sube completo cuando se guarda la muestra.
   */
  private readonly LADO_MAX_VALIDACION = 768;
  private readonly CALIDAD_JPEG = 0.8;

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

  validar(file: File): Observable<ApiResponse<ResultadoValidacion>> {
    return from(this.reducirParaValidar(file)).pipe(
      // Si el navegador no puede procesar el formato (HEIC, por ejemplo),
      // se manda el original antes que dejar la imagen sin verificar.
      catchError(() => of(file as Blob)),
      switchMap(blob => {
        const formData = new FormData();
        formData.append('file', blob, 'validacion.jpg');
        return this.api.postFormData<ApiResponse<ResultadoValidacion>>(
          endpoint.IMAGENES_VALIDAR, formData
        );
      })
    );
  }

  /** Reescala la imagen en el navegador y la recomprime como JPEG. */
  private async reducirParaValidar(file: File): Promise<Blob> {
    const bitmap = await this.cargarBitmap(file);

    const mayor = Math.max(bitmap.width, bitmap.height);
    const escala = mayor > this.LADO_MAX_VALIDACION ? this.LADO_MAX_VALIDACION / mayor : 1;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    if ('close' in bitmap) (bitmap as ImageBitmap).close();

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir'))),
        'image/jpeg',
        this.CALIDAD_JPEG
      );
    });
  }

  private async cargarBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
    if ('createImageBitmap' in window) {
      return createImageBitmap(file);
    }

    // Safari antiguo: no tiene createImageBitmap.
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagen ilegible')); };
      img.src = url;
    });
  }
}
