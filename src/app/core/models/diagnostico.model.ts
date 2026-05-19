export interface ResultadoDiagnostico {
  riesgo: 'bajo' | 'moderado' | 'alto';
  enfermedad: string;
  confianza: number;
}

export interface Diagnostico {
  id?: string;
  muestraId: string;
  parcelaId?: string;
  userId?: string;
  resultado: ResultadoDiagnostico;
  motivo?: string;
  recomendaciones?: string[];
  createdAt?: string;
}
