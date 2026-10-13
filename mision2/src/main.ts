import './style.css';
import { fetchRanking, fetchCuberDetails } from './api';
import { construirCuber, filtrarPorPais, calcularMediaTop, type RankingItem } from './transformers';
import { mostrarLoader, pintarResultados, mostrarError, inicializarSelectPaises, toggleBoton } from './ui';

const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
const selectPais = document.getElementById('select-pais') as HTMLSelectElement;

// Inicializamos el selector de forma dinámica al cargar la página
inicializarSelectPaises(selectPais);

btnCargar.addEventListener('click', async () => {
    try {
        toggleBoton(btnCargar, true);
        mostrarLoader();
        
        const rankingCrudo = await fetchRanking('333', 'single');
        
        // Ampliamos el rango a 150 para que el filtro de países tenga un volumen real de datos
        const topCrudo: RankingItem[] = rankingCrudo.items.slice(0, 150);
        
        const datosPromises = topCrudo.map(async (item) => {
            const detalles = await fetchCuberDetails(item.personId);
            return construirCuber(item, detalles); // Transformación encapsulada
        });

        const datosCompletos = await Promise.all(datosPromises);
        
        // Filtramos TODO el grupo, y luego nos quedamos con el Top 50 del país seleccionado
        const pais = selectPais.value;
        const datosFiltrados = filtrarPorPais(datosCompletos, pais).slice(0, 50);
        
        const mediaEstadistica = calcularMediaTop(datosFiltrados); // Función pura real

        pintarResultados(datosFiltrados, mediaEstadistica);

    } catch (error) {
        console.error("Fallo crítico:", error);
        mostrarError("Hubo un problema al contactar con la API.");
    } finally {
        toggleBoton(btnCargar, false);
    }
});