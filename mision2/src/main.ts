import './style.css';
import { fetchRanking, fetchCuberDetails } from './api';
import { filtrarPorPais, calcularMediaTop } from './transformers';
import { mostrarLoader, pintarResultados, mostrarError } from './ui';

const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
const selectPais = document.getElementById('select-pais') as HTMLSelectElement;

btnCargar.addEventListener('click', async () => {
    try {
        mostrarLoader();
        
        // 1. Traer el ranking mundial (solo IDs y tiempos)
        const rankingCrudo = await fetchRanking('333', 'single');
        
        // 2. Extraer solo el Top 10 para no saturar la API
        const top10Crudo = rankingCrudo.items.slice(0, 10);
        
        // 3. Cruzar datos asíncronamente (Camino B: Promise.all)
        // Por cada competidor, hacemos una petición simultánea para descubrir su identidad
        const datosConNombresPromises = top10Crudo.map(async (item: any) => {
            const detalles = await fetchCuberDetails(item.personId);
            return {
                id: item.personId,
                nombre: detalles ? detalles.name : "Nombre desconocido",
                pais: detalles ? detalles.country : "País desconocido",
                tiempoS: (item.best / 100).toFixed(2) + "s",
                tiempoMs: item.best
            };
        });

        // Esperamos a que se resuelvan las 10 peticiones a la vez
        const datosCompletos = await Promise.all(datosConNombresPromises);
        
        // 4. Ejecutar transformaciones puras
        const pais = selectPais.value;
        const datosFiltrados = filtrarPorPais(datosCompletos, pais);
        
        // 5. Análisis matemático (reduce)
        calcularMediaTop(datosFiltrados);

        // 6. Inyectar en el DOM
        pintarResultados(datosFiltrados);

    } catch (error) {
        console.error("Fallo en la orquestación:", error);
        mostrarError("Hubo un problema crítico al contactar con la API de la WCA.");
    }
});