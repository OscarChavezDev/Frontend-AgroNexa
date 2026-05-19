export interface Ubicacion {
  lat: number;
  lng: number;
}

export interface Parcela {
  id?: string;
  userId?: string;
  nombre: string;
  ubicacion: Ubicacion;
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
