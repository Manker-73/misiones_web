export interface CacheEntry<T> {
    datos: T;
    timestamp: number;
}

const CACHE_PREFIX = 'wca_';
export const TTL_RANKING_MS = 24 * 60 * 60 * 1000;
export const TTL_PERFIL_MS = 30 * 24 * 60 * 60 * 1000;

export const limpiarCachePropia = (): void => {
    try {
        Object.keys(localStorage)
            .filter((clave) => clave.startsWith(CACHE_PREFIX))
            .forEach((clave) => localStorage.removeItem(clave));
    } catch {
        // Ignoramos errores si el acceso a localStorage está bloqueado en el navegador
    }
};

export const eliminarDeCache = (clave: string): void => {
    try {
        localStorage.removeItem(clave);
    } catch {
        // Ignoramos si el almacenamiento está restringido
    }
};

export const guardarEnCache = <T>(clave: string, datos: T): void => {
    const payload: CacheEntry<T> = { datos, timestamp: Date.now() };
    try {
        localStorage.setItem(clave, JSON.stringify(payload));
    } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            limpiarCachePropia();
            try {
                localStorage.setItem(clave, JSON.stringify(payload));
            } catch {
                // Si tras limpiar nuestra propia caché sigue sin caber, omitimos el guardado
            }
        }
    }
};

export const leerDeCache = <T>(clave: string, maxEdadMs: number = TTL_RANKING_MS): T | null => {
    try {
        const item = localStorage.getItem(clave);
        if (!item) return null;

        const parseado = JSON.parse(item) as Partial<CacheEntry<T>>;
        if (typeof parseado.timestamp !== 'number' || parseado.datos === undefined) {
            eliminarDeCache(clave);
            return null;
        }

        if (Date.now() - parseado.timestamp > maxEdadMs) {
            eliminarDeCache(clave);
            return null;
        }

        return parseado.datos;
    } catch {
        eliminarDeCache(clave);
        return null;
    }
};