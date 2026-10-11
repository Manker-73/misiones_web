export const fetchRanking = async (evento: string, tipo: string) => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/rank/world/${tipo}/${evento}.json`;
    const cacheKey = `wca_${evento}_${tipo}`;

    // BONUS: Comprobar Caché
    const datosCacheados = localStorage.getItem(cacheKey);
    if (datosCacheados) {
        console.log("⚡ Cargado desde LocalStorage instantáneamente");
        return JSON.parse(datosCacheados);
    }

    // Fetch tradicional si no hay caché
    console.log("🌐 Descargando desde la API...");
    const response = await fetch(url);
    
    // Robustez: Controlar si la API se cae
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // Guardar en caché para la próxima
    localStorage.setItem(cacheKey, JSON.stringify(data));
    
    return data;
};