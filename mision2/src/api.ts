import { eliminarDeCache, guardarEnCache, leerDeCache } from './cache';
import {
    TAMANO_LOTE_PETICIONES,
    type CodigoEventoWCA,
    type PersonDetails,
    type RankingItem,
    type RankingResponse,
    type ResultadoDetalle,
    type ResultadoLotes,
    type TipoRanking
} from './types';

const TIMEOUT_MS = 8000;
const TTL_PERFIL_MS = 30 * 24 * 60 * 60 * 1000;

const fetchConTimeout = async (url: string): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        return await fetch(url, { signal: controller.signal });
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Error de red: Tiempo de espera agotado (Timeout de 8s superado).');
        }
        throw new Error('Error de red: Sin conexión con el servidor. Comprueba tu acceso a internet.');
    } finally {
        window.clearTimeout(timeoutId);
    }
};

const esRankingValido = (data: unknown): data is RankingResponse => {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    if (!Array.isArray(obj.items)) return false;
    return obj.items.every(
        (item) =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as Record<string, unknown>).personId === 'string' &&
            typeof (item as Record<string, unknown>).best === 'number'
    );
};

const esPersonaValida = (data: unknown): data is PersonDetails => {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    return typeof obj.name === 'string' && typeof obj.country === 'string';
};

export const fetchRanking = async (
    evento: CodigoEventoWCA,
    tipo: TipoRanking
): Promise<RankingResponse> => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/rank/world/${tipo}/${evento}.json`;
    const cacheKey = `wca_ranking_${evento}_${tipo}`;

    const cache = leerDeCache<RankingResponse>(cacheKey);
    if (cache !== null) {
        if (esRankingValido(cache)) {
            return cache;
        }
        eliminarDeCache(cacheKey);
    }

    const response = await fetchConTimeout(url);
    if (!response.ok) {
        throw new Error(
            `Error HTTP ${response.status}: El servidor rechazó la petición (${response.statusText || 'No encontrado'}).`
        );
    }

    let data: unknown;
    try {
        data = await response.json();
    } catch {
        throw new Error('Datos inválidos: La respuesta recibida no tiene un formato JSON válido.');
    }

    if (!esRankingValido(data)) {
        throw new Error('Datos inválidos: La estructura del ranking de la WCA no contiene una lista válida.');
    }

    guardarEnCache(cacheKey, data);
    return data;
};

export const fetchCuberDetails = async (personId: string): Promise<ResultadoDetalle> => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/persons/${personId}.json`;
    const cacheKey = `wca_person_${personId}`;

    const cache = leerDeCache<PersonDetails>(cacheKey, TTL_PERFIL_MS);
    if (cache !== null) {
        if (esPersonaValida(cache)) {
            return { id: personId, detalle: cache };
        }
        eliminarDeCache(cacheKey);
    }

    let response: Response;
    try {
        response = await fetchConTimeout(url);
    } catch {
        return { id: personId, detalle: null, motivoFallo: 'red' };
    }

    if (!response.ok) {
        return { id: personId, detalle: null, motivoFallo: 'no_encontrado' };
    }

    try {
        const data: unknown = await response.json();
        if (!esPersonaValida(data)) {
            return { id: personId, detalle: null, motivoFallo: 'datos_invalidos' };
        }

        const dataLigera: PersonDetails = {
            name: data.name.trim(),
            country: data.country.trim().toUpperCase()
        };

        guardarEnCache(cacheKey, dataLigera);
        return { id: personId, detalle: dataLigera };
    } catch {
        return { id: personId, detalle: null, motivoFallo: 'datos_invalidos' };
    }
};

export const fetchDetallesEnLotes = async (
    items: RankingItem[],
    tamanoLote: number = TAMANO_LOTE_PETICIONES,
    onProgress?: (completados: number, total: number) => void
): Promise<ResultadoLotes> => {
    const detallesPorId: Record<string, PersonDetails> = {};
    let fallidosRed = 0;
    let fallidosInexistentes = 0;
    const total = items.length;
    const totalLotes = Math.ceil(total / tamanoLote);

    const lotes = Array.from({ length: totalLotes }, (_, idx) =>
        items.slice(idx * tamanoLote, (idx + 1) * tamanoLote)
    );

    await lotes.reduce(async (promesaAnterior, lote, indiceLote) => {
        await promesaAnterior;

        const resultadosLote = await Promise.all(
            lote.map((item) => fetchCuberDetails(item.personId))
        );

        let fallosRedEnLote = 0;

        resultadosLote.forEach(({ id, detalle, motivoFallo }) => {
            if (detalle) {
                detallesPorId[id] = detalle;
            } else if (motivoFallo === 'red') {
                fallidosRed += 1;
                fallosRedEnLote += 1;
            } else {
                fallidosInexistentes += 1;
            }
        });

        if (fallosRedEnLote === lote.length && lote.length > 0) {
            throw new Error(
                'Error de red: Se perdió la conexión al descargar los perfiles de los competidores.'
            );
        }

        const completados = Math.min((indiceLote + 1) * tamanoLote, total);
        if (onProgress) onProgress(completados, total);
    }, Promise.resolve());

    return { detallesPorId, fallidosRed, fallidosInexistentes };
};