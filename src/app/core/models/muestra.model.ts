export interface DatosSensor {
  ph?: number;
  nitrogeno?: number;
  fosforo?: number;
  potasio?: number;
  humedadSuelo?: number;
  temperaturaSuelo?: number;
  conductividadElectrica?: number;
}

export interface ImagenMuestra {
  id?: string;
  url: string;
  tipoImagen?: string;
  descripcion?: string;
}

export interface Muestra {
  id?: string;
  parcelaId: string;
  userId?: string;
  /** Nodo de la parcela del que se extrajo la muestra. */
  nodoId?: string | null;
  /** Coordenadas reales de la toma, si se capturaron por GPS. */
  coordenadas?: { lat: number; lng: number } | null;
  parteAfectada?: string;
  nivelAfectacion?: string;
  observaciones?: string;
  sintomas?: string[];
  datosSensor?: DatosSensor;
  estado?: 'registrado' | 'diagnosticado' | 'eliminado';
  createdAt?: string;
  updatedAt?: string;
}
