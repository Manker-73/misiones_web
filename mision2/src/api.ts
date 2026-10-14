import { guardarEnCache, leerDeCache } from './cache';

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

export interface ResultadoLotes {
    detallesPorId: Record<string, PersonDetails>;
    fallidos: number;
}

const TIMEOUT_MS = 8000;

const fetchConTimeout = async (url: string): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        return await fetch(url, { signal: controller.signal });
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Error de red: Tiempo de espera agotado (Timeout de 8s superado).');
        }
        throw new Error('Error de red: No se pudo conectar con el servidor. Comprueba tu conexión.');
    } finally {
        window.clearTimeout(timeoutId);
    }
};

// Type Guards para validar datos externos sin usar 'any'
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

export const fetchRanking = async (evento: string, tipo: string): Promise<RankingResponse> => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/rank/world/${tipo}/${evento}.json`;
    const cacheKey = `wca_ranking_${evento}_${tipo}`;

    const cache = leerDeCache<RankingResponse>(cacheKey);
    if (cache && esRankingValido(cache)) return cache;

    const response = await fetchConTimeout(url);
    if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: El servidor rechazó la petición (${response.statusText || 'No encontrado'}).`);
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

export const fetchCuberDetails = async (personId: string): Promise<PersonDetails | null> => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/persons/${personId}.json`;
    const cacheKey = `wca_person_${personId}`;

    const cache = leerDeCache<PersonDetails>(cacheKey, 30 * 24 * 60 * 60 * 1000);
    if (cache && esPersonaValida(cache)) return cache;

    try {
        const response = await fetchConTimeout(url);
        if (!response.ok) return null;

        const data: unknown = await response.json();
        if (!esPersonaValida(data)) return null;

        const dataLigera: PersonDetails = {
            name: data.name.trim(),
            country: data.country.trim().toUpperCase()
        };

        guardarEnCache(cacheKey, dataLigera);
        return dataLigera;
    } catch {
        return null;
    }
};

// Concurrencia controlada en lotes de 25 peticiones sin usar bucles 'for'
export const fetchDetallesEnLotes = async (
    items: RankingItem[],
    tamanoLote: number = 25,
    onProgress?: (completados: number, total: number) => void
): Promise<ResultadoLotes> => {
    const detallesPorId: Record<string, PersonDetails> = {};
    let fallidos = 0;
    const total = items.length;
    const totalLotes = Math.ceil(total / tamanoLote);

    const lotes = Array.from({ length: totalLotes }, (_, idx) =>
        items.slice(idx * tamanoLote, (idx + 1) * tamanoLote)
    );

    await lotes.reduce(async (promesaAnterior, lote, indiceLote) => {
        await promesaAnterior;

        const resultadosLote = await Promise.all(
            lote.map(async (item) => ({
                id: item.personId,
                detalle: await fetchCuberDetails(item.personId)
            }))
        );

        resultadosLote.forEach(({ id, detalle }) => {
            if (detalle) {
                detallesPorId[id] = detalle;
            } else {
                fallidos += 1;
            }
        });

        const completados = Math.min((indiceLote + 1) * tamanoLote, total);
        if (onProgress) onProgress(completados, total);
    }, Promise.resolve());

    return { detallesPorId, fallidos };
};