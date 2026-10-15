// src/api.ts
import {
    TTL_PERFIL_MS,
    TTL_RANKING_MS,
    eliminarDeCache,
    guardarEnCache,
    leerDeCache
} from './cache';
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

export class ConsultaCanceladaError extends Error {
    constructor() {
        super('Consulta cancelada por el usuario.');
        this.name = 'ConsultaCanceladaError';
    }
}

const fetchConTimeout = async (url: string, externalSignal?: AbortSignal): Promise<Response> => {
    if (externalSignal?.aborted) {
        throw new ConsultaCanceladaError();
    }

    const timeoutController = new AbortController();
    const timeoutId = window.setTimeout(() => timeoutController.abort(), TIMEOUT_MS);
    const abortarPorUsuario = (): void => timeoutController.abort();

    externalSignal?.addEventListener('abort', abortarPorUsuario, { once: true });

    try {
        return await fetch(url, { signal: timeoutController.signal });
    } catch (error) {
        if (externalSignal?.aborted) {
            throw new ConsultaCanceladaError();
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Error de red: Tiempo de espera agotado (Timeout de 8s superado).');
        }
        throw new Error('Error de red: Sin conexión con el servidor. Comprueba tu acceso a internet.');
    } finally {
        window.clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', abortarPorUsuario);
    }
};

export const esRankingValido = (data: unknown): data is RankingResponse => {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    if (!Array.isArray(obj.items)) return false;
    return obj.items.every((item) => {
        if (typeof item !== 'object' || item === null) return false;
        const registro = item as Record<string, unknown>;
        return (
            typeof registro.personId === 'string' &&
            registro.personId.trim().length > 0 &&
            typeof registro.best === 'number' &&
            Number.isFinite(registro.best) &&
            registro.best > 0
        );
    });
};

export const esPersonaValida = (data: unknown): data is PersonDetails => {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    return (
        typeof obj.name === 'string' &&
        obj.name.trim().length > 0 &&
        typeof obj.country === 'string' &&
        obj.country.trim().length > 0
    );
};

export const fetchRankingDesdeRed = async (
    evento: CodigoEventoWCA,
    tipo: TipoRanking,
    signal?: AbortSignal
): Promise<RankingResponse> => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/rank/world/${tipo}/${evento}.json`;
    const response = await fetchConTimeout(url, signal);

    if (!response.ok) {
        throw new Error(
            `Error HTTP ${response.status}: El servidor rechazó la petición (${response.statusText || 'No encontrado'}).`
        );
    }

    let data: unknown;
    try {
        data = await response.json();
    } catch {
        if (signal?.aborted) throw new ConsultaCanceladaError();
        throw new Error('Datos inválidos: La respuesta recibida no tiene un formato JSON válido.');
    }

    if (!esRankingValido(data)) {
        throw new Error('Datos inválidos: La estructura del ranking de la WCA no contiene una lista válida.');
    }

    return data;
};

export const fetchRanking = async (
    evento: CodigoEventoWCA,
    tipo: TipoRanking,
    signal?: AbortSignal
): Promise<RankingResponse> => {
    if (signal?.aborted) throw new ConsultaCanceladaError();

    const cacheKey = `wca_ranking_${evento}_${tipo}`;
    const cache = leerDeCache<RankingResponse>(cacheKey, TTL_RANKING_MS);
    if (cache !== null) {
        if (esRankingValido(cache)) {
            return cache;
        }
        eliminarDeCache(cacheKey);
    }

    const data = await fetchRankingDesdeRed(evento, tipo, signal);
    guardarEnCache(cacheKey, data);
    return data;
};

export const fetchCuberDetailsDesdeRed = async (
    personId: string,
    signal?: AbortSignal
): Promise<ResultadoDetalle> => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/persons/${personId}.json`;

    let response: Response;
    try {
        response = await fetchConTimeout(url, signal);
    } catch (error) {
        if (error instanceof ConsultaCanceladaError || signal?.aborted) {
            throw new ConsultaCanceladaError();
        }
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

        return { id: personId, detalle: dataLigera };
    } catch {
        if (signal?.aborted) throw new ConsultaCanceladaError();
        return { id: personId, detalle: null, motivoFallo: 'datos_invalidos' };
    }
};

export const fetchCuberDetails = async (
    personId: string,
    signal?: AbortSignal
): Promise<ResultadoDetalle> => {
    if (signal?.aborted) throw new ConsultaCanceladaError();

    const cacheKey = `wca_person_${personId}`;
    const cache = leerDeCache<PersonDetails>(cacheKey, TTL_PERFIL_MS);
    if (cache !== null) {
        if (esPersonaValida(cache)) {
            return { id: personId, detalle: cache };
        }
        eliminarDeCache(cacheKey);
    }

    const resultado = await fetchCuberDetailsDesdeRed(personId, signal);
    if (resultado.detalle) {
        guardarEnCache(cacheKey, resultado.detalle);
    }
    return resultado;
};

export const fetchDetallesEnLotes = async (
    items: RankingItem[],
    tamanoLote: number = TAMANO_LOTE_PETICIONES,
    onProgress?: (completados: number, total: number) => void,
    signal?: AbortSignal
): Promise<ResultadoLotes> => {
    const detallesPorId: Record<string, PersonDetails> = {};
    let fallidosRed = 0;
    let fallidosInexistentes = 0;
    const total = items.length;
    const totalLotes = Math.ceil(total / tamanoLote);

    const lotes = Array.from({ length: totalLotes }, (_, idx) =>
        items.slice(idx * tamanoLote, (idx + 1) * tamanoLote)
    );

    for (const [indiceLote, lote] of lotes.entries()) {
        if (signal?.aborted) {
            throw new ConsultaCanceladaError();
        }

        const resultadosLote = await Promise.all(
            lote.map((item) => fetchCuberDetails(item.personId, signal))
        );

        if (signal?.aborted) {
            throw new ConsultaCanceladaError();
        }

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
    }

    return { detallesPorId, fallidosRed, fallidosInexistentes };
};