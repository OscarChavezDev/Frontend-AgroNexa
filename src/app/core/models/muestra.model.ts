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
  parteAfectada?: string;
  nivelAfectacion?: string;
  observaciones?: string;
  sintomas?: string[];
  datosSensor?: DatosSensor;
  estado?: 'registrado' | 'diagnosticado' | 'eliminado';
  createdAt?: string;
  updatedAt?: string;
}
