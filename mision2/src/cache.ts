export interface CacheEntry<T> {
    datos: T;
    timestamp: number;
}

const CACHE_PREFIX = 'wca_';

export const limpiarCachePropia = (): void => {
    Object.keys(localStorage)
        .filter((clave) => clave.startsWith(CACHE_PREFIX))
        .forEach((clave) => localStorage.removeItem(clave));
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

export const leerDeCache = <T>(clave: string, maxEdadMs: number = 86400000): T | null => {
    try {
        const item = localStorage.getItem(clave);
        if (!item) return null;

        const parseado = JSON.parse(item) as Partial<CacheEntry<T>>;
        if (typeof parseado.timestamp !== 'number' || parseado.datos === undefined) {
            localStorage.removeItem(clave);
            return null;
        }

        if (Date.now() - parseado.timestamp > maxEdadMs) {
            localStorage.removeItem(clave);
            return null;
        }

        return parseado.datos;
    } catch {
        localStorage.removeItem(clave);
        return null;
    }
};