// 1. Definimos la "forma" de nuestros datos para que TypeScript nos ayude
export interface Cuber {
    id: string;
    nombre: string;
    pais: string;
    tiempoS: string;
    tiempoMs: number;
}

// 2. Método FILTER: Para la funcionalidad de filtrado por país
export const filtrarPorPais = (cubers: Cuber[], pais: string): Cuber[] => {
    // Si el usuario elige "All" (Todo el mundo), devolvemos el array intacto
    if (pais === 'All') return cubers;
    
    // Si no, devolvemos solo los que coincidan con el país elegido
    return cubers.filter(cuber => cuber.pais === pais);
};

// 3. Método REDUCE: Para el análisis matemático
export const calcularMediaTop = (cubers: Cuber[]) => {
    // Si el array está vacío evitamos errores
    if (cubers.length === 0) {
        console.log("No hay competidores para analizar.");
        return;
    }
    
    // Reducimos el array para sumar todos los tiempos en milisegundos
    const sumaTotal = cubers.reduce((acumulador, cuber) => acumulador + cuber.tiempoMs, 0);
    
    // Calculamos la media y la formateamos a segundos
    const media = (sumaTotal / cubers.length / 100).toFixed(2);
    
    // Imprimimos el resultado analítico en la consola
    console.log(`La media del Top ${cubers.length} en pantalla es ${media} segundos.`);
};