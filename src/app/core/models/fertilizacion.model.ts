import { Clima } from './clima.model';

export type NivelSuelo =
  | 'bajo' | 'medio' | 'alto'
  | 'optimo' | 'acido' | 'muy_acido' | 'alcalino' | 'muy_alcalino'
  | 'elevado' | 'salino' | 'seco' | 'adecuado' | 'saturado'
  | 'sin_dato';

export interface LecturaSuelo {
  valor?: number | null;
  estado: NivelSuelo;
  unidad?: string;
  optimo?: string;
}

export interface Suelo {
  ph: LecturaSuelo;
  nitrogeno: LecturaSuelo;
  fosforo: LecturaSuelo;
  potasio: LecturaSuelo;
  conductividadElectrica: LecturaSuelo;
  humedadSuelo: LecturaSuelo;
}

export interface ItemFertilizante {
  producto: string;
  nutriente?: string;
  dosisHa?: string;
  nutrienteHa?: string;
  totalParcela?: string;
  dosisPlanta?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  justificacion?: string;
  momento?: string;
  nota?: string;
}

export interface MejorDia {
  fecha: string;
  precipitacionMm?: number;
  descripcion?: string;
  porque?: string;
}

export interface VentanaAplicacion {
  apto: boolean | null;
  estado: 'ideal' | 'aceptable' | 'lluvia_excesiva' | 'muy_seco' | 'sin_datos';
  motivo: string;
  recomendacion?: string;
  mejorDia?: MejorDia;
  lluvia72hMm?: number;
  lluvia7diasMm?: number;
  advertencias?: string[];
}

export interface PasoCronograma {
  momento: string;
  accion: string;
}

export interface PlanFertilizacion {
  resumen: string;
  suelo: Suelo;
  correccionPh?: ItemFertilizante | null;
  fertilizantes: ItemFertilizante[];
  materiaOrganica?: ItemFertilizante;
  ventanaAplicacion: VentanaAplicacion;
  advertencias: string[];
  cronograma?: PasoCronograma[];
  parcelaInfo?: { areaHa?: number | null; cantidadPlantas?: number | null };
}

export interface FertilizacionResponse {
  id?: string;
  parcelaId?: string;
  muestraId?: string;
  plan: PlanFertilizacion;
  clima?: Clima | null;
  resumen?: string;
  aptoParaAplicar?: boolean | null;
  estadoVentana?: string;
  fuente: 'ia' | 'reglas';
  modelo_ia?: string | null;
  fecha_generacion?: string;
  createdAt?: string;
  muestraUsada?: { id: string; fecha?: string };
  parcela?: { id: string; nombre: string; cultivo?: string };
  avisoClima?: string;
}

export type EstadoNodo = 'critico' | 'atencion' | 'bueno' | 'sin_datos';

/** Un nodo de la parcela con la lectura de su muestra más reciente. */
export interface NodoSuelo {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  descripcion?: string;
  suelo: Suelo | null;
  estado: EstadoNodo;
  resumen: string;
  ultimaMuestra: { id: string; fecha?: string } | null;
}

export interface MapaSuelo {
  parcela: {
    id: string;
    nombre: string;
    cultivo?: string;
    ubicacion?: { lat: number; lng: number };
    poligono: { lat: number; lng: number }[];
  };
  nodos: NodoSuelo[];
  muestrasSinNodo: number;
  totalMuestras: number;
}

/** Respuesta de /preview: estado del suelo y clima, sin generar el plan aún. */
export interface FertilizacionPreview {
  parcela: { id: string; nombre: string; cultivo?: string };
  tieneMuestra: boolean;
  muestraUsada?: { id: string; fecha?: string } | null;
  suelo: Suelo;
  clima?: Clima | null;
  ventanaAplicacion: VentanaAplicacion;
}
