export const fetchRanking = async (evento: string, tipo: string) => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/rank/world/${tipo}/${evento}.json`;
    const cacheKey = `wca_${evento}_${tipo}`;

    //Comprobar Caché
    const datosCacheados = localStorage.getItem(cacheKey);
    if (datosCacheados) {
        console.log("Cargado desde LocalStorage");
        return JSON.parse(datosCacheados);
    }

    // Fetch tradicional si no hay caché
    console.log("Descargando desde la API");
    const response = await fetch(url);
    
    // Controlar si la API se cae
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // Guardar en caché para la próxima
    localStorage.setItem(cacheKey, JSON.stringify(data));
    
    return data;
};

export const fetchCuberDetails = async (personId: string) => {
    const url = `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/persons/${personId}.json`;
    const cacheKey = `wca_person_${personId}`;

    const datosCacheados = localStorage.getItem(cacheKey);
    if (datosCacheados) {
        return JSON.parse(datosCacheados);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) return null; 
        
        const data = await response.json();
        
        //Creamos un objeto ligero solo con los datos vitales
        const dataLigera = {
            name: data.name,
            country: data.country
        };
        
        // Guardamos la versión ligera
        localStorage.setItem(cacheKey, JSON.stringify(dataLigera));
        
        return dataLigera;
    } catch (error) {
        console.error(`Error al buscar detalles de ${personId}:`, error);
        return null;
    }
};