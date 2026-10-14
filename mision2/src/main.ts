// src/main.ts
import './style.css';
import { fetchRanking, fetchDetallesEnLotes } from './api';
import {
    obtenerOpcionesPaises,
    procesarRankingCompleto,
    acotarLimite
} from './transformers';
import {
    mostrarLoader,
    pintarResultados,
    mostrarError,
    inicializarSelectPaises,
    toggleBoton
} from './ui';

const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
const selectPais = document.getElementById('select-pais') as HTMLSelectElement;
const inputTop = document.getElementById('input-top') as HTMLInputElement;

const MUESTRA_MAXIMA_RANKING = 1000;
const TAMANO_LOTE = 50;

// Poblamos el selector de países sin acoplar ui.ts al diccionario
inicializarSelectPaises(selectPais, obtenerOpcionesPaises());

// Función de orquestación reutilizable
const ejecutarAnalisisRanking = async (): Promise<void> => {
    try {
        const limiteValidado = acotarLimite(inputTop.value, 1, MUESTRA_MAXIMA_RANKING);
        inputTop.value = String(limiteValidado);

        toggleBoton(btnCargar, true);
        mostrarLoader();

        const rankingCrudo = await fetchRanking('333', 'single');

        // Si el filtro es global ('All'), solo descargamos los perfiles que el usuario pidió ver.
        // Si filtra por un país concreto, inspeccionamos hasta los 1000 del ranking mundial.
        const cantidadNecesaria =
            selectPais.value === 'All' ? limiteValidado : MUESTRA_MAXIMA_RANKING;
        const muestraRanking = rankingCrudo.items.slice(0, cantidadNecesaria);

        const { detallesPorId, fallidos } = await fetchDetallesEnLotes(
            muestraRanking,
            TAMANO_LOTE,
            (completados, total) => mostrarLoader(completados, total)
        );

        const resultado = procesarRankingCompleto(
            muestraRanking,
            detallesPorId,
            selectPais.value,
            inputTop.value,
            fallidos
        );

        pintarResultados(resultado);
    } catch (error) {
        console.error('Fallo en la orquestación:', error);
        const mensaje =
            error instanceof Error
                ? error.message
                : 'Error inesperado al procesar los datos de la WCA.';
        mostrarError(mensaje);
    } finally {
        toggleBoton(btnCargar, false);
    }
};

btnCargar.addEventListener('click', ejecutarAnalisisRanking);