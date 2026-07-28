export interface Ubicacion {
  lat: number;
  lng: number;
}

/** Punto de muestreo dentro de la parcela. El `id` lo asigna el backend. */
export interface NodoParcela {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  descripcion?: string;
}

export interface Parcela {
  id?: string;
  userId?: string;
  nombre: string;
  ubicacion: Ubicacion;
  /** Vértices del lindero, en orden. Vacío si no se dibujó. */
  poligono?: Ubicacion[];
  nodos?: NodoParcela[];
  areaAproximada?: number;
  unidadArea?: string;
  cultivo: string;
  variedad?: string;
  edadCultivo?: string;
  cantidadPlantas?: number;
  sistemaCultivo?: string;
  referencia: string;
  observaciones?: string;
  estado?: 'activo' | 'inactivo';
  createdAt?: string;
  updatedAt?: string;
}
