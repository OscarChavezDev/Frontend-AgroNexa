export interface ClimaActual {
  temperatura?: number;
  humedadRelativa?: number;
  precipitacionMm?: number;
  viento?: number;
  codigo?: number;
  descripcion: string;
}

export interface DiaPronostico {
  fecha: string;
  tempMax?: number;
  tempMin?: number;
  precipitacionMm: number;
  probabilidadLluvia: number;
  vientoMax?: number;
  codigo?: number;
  descripcion: string;
}

export interface Clima {
  actual: ClimaActual;
  pronostico: DiaPronostico[];
  lluvia72hMm: number;
  lluvia7diasMm: number;
  zonaHoraria?: string;
  coordenadas?: { lat: number; lng: number };
  parcela?: { id: string; nombre: string };
}
