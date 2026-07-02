// ── Estructura nueva devuelta por Gemini ──────────────────────────────────────

export interface DiagnosticoPrincipal {
  enfermedad: string;
  nombre_cientifico?: string;
  probabilidad?: string;
  confianza: 'alta' | 'media' | 'baja';
  descripcion: string;
}

export interface DiagnosticoDiferencial {
  enfermedad: string;
  probabilidad: string;
  razon: string;
}

export interface Severidad {
  nivel: 'leve' | 'moderado' | 'severo' | 'crítico';
  porcentaje_afectacion: string;
  etapa: 'inicial' | 'intermedia' | 'avanzada';
}

export interface RecomendacionesIA {
  acciones_inmediatas: string[];
  tratamiento: string[];
  prevencion: string[];
  monitoreo: string;
}

export interface ResultadoGemini {
  diagnostico_principal: DiagnosticoPrincipal;
  diagnosticos_diferenciales: DiagnosticoDiferencial[];
  severidad: Severidad;
  sintomas_detectados: string[];
  factores_riesgo: string[];
  recomendaciones: RecomendacionesIA;
  requiere_asistencia_tecnica: boolean;
  notas_adicionales?: string;
}

// ── Estructura vieja (compatibilidad) ─────────────────────────────────────────

export interface ResultadoDiagnostico {
  riesgo: 'bajo' | 'moderado' | 'alto';
  enfermedad: string;
  confianza: number | string;
}

// ── Modelo principal ──────────────────────────────────────────────────────────

export interface Diagnostico {
  id?: string;
  muestraId: string;
  parcelaId?: string;
  userId?: string;

  // Campos Gemini IA
  resultado_json?: ResultadoGemini;
  enfermedad_principal?: string;
  confianza?: string;
  severidad?: string;
  estado?: 'pendiente' | 'completado' | 'error';
  mensaje_error?: string;
  modelo_ia?: string;
  fecha_analisis?: string;

  // Campos de compatibilidad
  resultado?: ResultadoDiagnostico;
  motivo?: string;
  recomendaciones?: string[];

  createdAt?: string;
  updatedAt?: string;
}
