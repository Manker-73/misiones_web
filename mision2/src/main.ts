import './style.css';
import { fetchRanking } from './api';
import { limpiarDatos, filtrarPorPais, calcularMediaTop } from './transformers';
import { mostrarLoader, pintarResultados, mostrarError } from './ui';

const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
const selectPais = document.getElementById('select-pais') as HTMLSelectElement;

btnCargar.addEventListener('click', async () => {
    try {
        mostrarLoader(); // 1. Mostrar estado de carga
        
        // 2. Traer datos (Red / Caché)
        const datosCrudos = await fetchRanking('333', 'single');
        
        // 3. Transformaciones (map, filter, reduce)
        const datosLimpios = limpiarDatos(datosCrudos);
        const pais = selectPais.value;
        const datosFiltrados = filtrarPorPais(datosLimpios, pais);
        
        // Ejecutamos nuestro reduce matemático
        calcularMediaTop(datosFiltrados);

        // 4. Renderizar en el DOM
        pintarResultados(datosFiltrados);

    } catch (error) {
        console.error(error);
        mostrarError("Hubo un problema al contactar con la API de la WCA.");
    }
});