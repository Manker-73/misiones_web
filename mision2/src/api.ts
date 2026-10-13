// Envoltorios seguros para LocalStorage
const guardarEnCache = (clave: string, datos: any) => {
    try {
        const payload = { datos, timestamp: Date.now() };
        localStorage.setItem(clave, JSON.stringify(payload));
    } catch (error) {
        console.warn(`Error al guardar en caché (${clave}):`, error);
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.warn("Limpiando caché por exceso de cuota.");
            localStorage.clear(); 
        }
    }
};

const leerDeCache = (clave: string, maxEdadMs: number = 86400000) => { // 24 horas por defecto
    try {
        const item = localStorage.getItem(clave);
        if (!item) return null;
        
        const parseado = JSON.parse(item);
        if (Date.now() - parseado.timestamp > maxEdadMs) {
            localStorage.removeItem(clave); // Caché obsoleta
            return null; 
        }
        return parseado.datos;
    } catch (error) {
        console.warn(`Caché corrupta eliminada (${clave}).`);
        localStorage.removeItem(clave);
        return null;
    }
};

export const fetchRanking = async (evento: string, tipo: string) => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/rank/world/${tipo}/${evento}.json`;
    const cacheKey = `wca_ranking_${evento}_${tipo}`;

    const cache = leerDeCache(cacheKey);
    if (cache) return cache;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    const data = await response.json();
    if (!data || !Array.isArray(data.items)) throw new Error("Estructura de ranking inválida");
    
    guardarEnCache(cacheKey, data);
    return data;
};

export const fetchCuberDetails = async (personId: string) => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/persons/${personId}.json`;
    const cacheKey = `wca_person_${personId}`;

    const cache = leerDeCache(cacheKey, 24 * 60 * 60 * 1000); // Los nombres caducan en 24 h
    if (cache) return cache;

    try {
        const response = await fetch(url);
        if (!response.ok) return null; 
        
        const data = await response.json();
        const dataLigera = { name: data.name, country: data.country };
        
        guardarEnCache(cacheKey, dataLigera);
        return dataLigera;
    } catch (error) {
        console.error(`Fallo de red al buscar a ${personId}:`, error);
        return null;
    }
};