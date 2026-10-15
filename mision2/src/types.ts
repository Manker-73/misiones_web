export const LIMITE_MINIMO_RANKING = 1;
export const LIMITE_MAXIMO_RANKING = 1000;
export const LIMITE_DEFECTO_RANKING = 50;
export const TAMANO_LOTE_PETICIONES = 50;

export type TipoRanking = 'single' | 'average';

export type CodigoEventoWCA =
    | '333'
    | '222'
    | '444'
    | '555'
    | '666'
    | '777'
    | '333bf'
    | '333oh'
    | 'clock'
    | 'minx'
    | 'pyram'
    | 'skewb'
    | 'sq1';

export interface OpcionEventoWCA {
    codigo: CodigoEventoWCA;
    nombre: string;
}

export const EVENTOS_WCA: readonly OpcionEventoWCA[] = [
    { codigo: '333', nombre: '3x3x3 Cube' },
    { codigo: '222', nombre: '2x2x2 Cube' },
    { codigo: '444', nombre: '4x4x4 Cube' },
    { codigo: '555', nombre: '5x5x5 Cube' },
    { codigo: '666', nombre: '6x6x6 Cube' },
    { codigo: '777', nombre: '7x7x7 Cube' },
    { codigo: '333bf', nombre: '3x3x3 Blindfolded (A ciegas)' },
    { codigo: '333oh', nombre: '3x3x3 One-Handed (Una mano)' },
    { codigo: 'clock', nombre: 'Clock' },
    { codigo: 'minx', nombre: 'Megaminx' },
    { codigo: 'pyram', nombre: 'Pyraminx' },
    { codigo: 'skewb', nombre: 'Skewb' },
    { codigo: 'sq1', nombre: 'Square-1' }
];

export interface RankingItem {
    personId: string;
    best: number;
}

export interface RankingResponse {
    items: RankingItem[];
}

export interface PersonDetails {
    name: string;
    country: string;
}

export type MotivoFalloDetalle = 'red' | 'no_encontrado' | 'datos_invalidos';

export interface ResultadoDetalle {
    id: string;
    detalle: PersonDetails | null;
    motivoFallo?: MotivoFalloDetalle;
}

export interface ResultadoLotes {
    detallesPorId: Record<string, PersonDetails>;
    fallidosRed: number;
    fallidosInexistentes: number;
}

export interface Cuber {
    id: string;
    nombre: string;
    codigoPais: string;
    nombrePais: string;
    bandera: string;
    tiempoS: string;
    tiempoMs: number;
}

export interface EstadisticasGrupo {
    mediaS: string;
    mejorS: string;
    peorS: string;
    paisDominante: string;
    totalPaisesDistintos: number;
}

export interface OpcionPais {
    codigo: string;
    nombre: string;
}

export interface ResultadoProcesamiento {
    cubers: Cuber[];
    estadisticas: EstadisticasGrupo | null;
    etiquetaPais: string;
    nombreEvento: string;
    tipoModalidad: TipoRanking;
    fallidosRed: number;
    fallidosInexistentes: number;
    opcionesPaisesActualizadas: OpcionPais[];
}