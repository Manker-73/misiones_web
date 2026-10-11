export interface Cuber {
    id: string;
    nombre: string;
    pais: string;
    tiempoS: string;
    tiempoMs: number; // En centisegundos reales para hacer cálculos
}

export const limpiarDatos = (datosCrudos: any): Cuber[] => {
    // 1. Imprimimos el primer competidor para ver sus verdaderos nombres de propiedad
    console.log("👀 Estructura real de la API v1:", datosCrudos.items[0]);

    // 2. Mapeamos usando alternativas con el operador || (OR)
    return datosCrudos.items.map((item: any) => ({
        id: item.personId || item.id,
        nombre: item.name || item.personName || "Nombre desconocido", // Probablemente ahora sea solo 'name'
        pais: item.countryId || item.country || "País desconocido", // La WCA suele usar 'countryId'
        tiempoS: (item.best / 100).toFixed(2) + "s",
        tiempoMs: item.best
    }));
};

export const filtrarPorPais = (cubers: Cuber[], pais: string): Cuber[] => {
    if (pais === 'All') return cubers;
    // FILTER: Filtramos por nacionalidad
    return cubers.filter(cuber => cuber.pais === pais);
};

export const calcularMediaTop = (cubers: Cuber[]) => {
    if (cubers.length === 0) return;
    
    // REDUCE: Sacar la media aritmética de los 10 primeros resultados
    const top10 = cubers.slice(0, 10);
    const sumaTotal = top10.reduce((acumulador, cuber) => acumulador + cuber.tiempoMs, 0);
    const media = (sumaTotal / top10.length / 100).toFixed(2);
    
    console.log(`📊 Análisis: La media del Top ${top10.length} de esta lista es ${media} segundos.`);
};