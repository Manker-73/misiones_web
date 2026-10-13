import './style.css';
import { fetchRanking, fetchCuberDetails } from './api';
import { construirCuber, filtrarPorPais, calcularMediaTop, type RankingItem } from './transformers';
import { mostrarLoader, pintarResultados, mostrarError, inicializarSelectPaises, toggleBoton } from './ui';

const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
const selectPais = document.getElementById('select-pais') as HTMLSelectElement;
const inputTop = document.getElementById('input-top') as HTMLInputElement;

inicializarSelectPaises(selectPais);

btnCargar.addEventListener('click', async () => {
    try {
        toggleBoton(btnCargar, true);
        mostrarLoader();
        
        const rankingCrudo = await fetchRanking('333', 'single');
        
        const topCrudo: RankingItem[] = rankingCrudo.items.slice(0, 1000);
        
        const datosPromises = topCrudo.map(async (item) => {
            const detalles = await fetchCuberDetails(item.personId);
            return construirCuber(item, detalles);
        });

        const datosCompletos = await Promise.all(datosPromises);
        
        // 2. Aplicamos el filtro por país
        const pais = selectPais.value;
        const datosFiltradosPorPais = filtrarPorPais(datosCompletos, pais);

        // 3. Leemos cuánto quiere ver el usuario y aplicamos el recorte final
        const limiteVisual = parseInt(inputTop.value, 10) || 50;
        
        // Aplicamos el slice final usando el límite del usuario
        const datosFinales = datosFiltradosPorPais.slice(0, limiteVisual);
        
        // 4. Calculamos la media SÓLO de los que vamos a mostrar
        const mediaEstadistica = calcularMediaTop(datosFinales); 

        // 5. Pintamos los resultados
        pintarResultados(datosFinales, mediaEstadistica, pais);

    } catch (error) {
        console.error("Fallo crítico:", error);
        mostrarError("Hubo un problema al contactar con la API.");
    } finally {
        toggleBoton(btnCargar, false);
    }
});