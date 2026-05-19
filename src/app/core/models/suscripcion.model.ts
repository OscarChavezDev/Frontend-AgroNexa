export interface Limites {
  parcelas: number;
  muestras: number;
}

export interface Plan {
  id?: string;
  codigo: string;
  nombre: string;
  precio: number;
  moneda: string;
  periodo: string;
  trialDias?: number;
  limites?: Limites;
  caracteristicas?: string[];
  estado?: string;
}

export interface Suscripcion {
  id?: string;
  userId?: string;
  plan: string;
  precio?: number;
  estado: 'activo' | 'inactivo' | 'cancelado';
  fechaInicio?: string;
  fechaFin?: string;
  trial?: boolean;
  trialInicio?: string;
  trialFin?: string;
  createdAt?: string;
}
