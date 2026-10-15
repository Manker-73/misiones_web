import './style.css';
import { fetchRanking, fetchDetallesEnLotes } from './api';
import {
    obtenerOpcionesEventos,
    obtenerOpcionesPaises,
    procesarRankingCompleto,
    acotarLimite,
    validarEventoWCA
} from './transformers';
import {
    LIMITE_MAXIMO_RANKING,
    LIMITE_MINIMO_RANKING,
    TAMANO_LOTE_PETICIONES,
    type TipoRanking
} from './types';
import {
    mostrarLoader,
    pintarResultados,
    mostrarError,
    inicializarSelectEventos,
    inicializarSelectPaises,
    toggleBoton
} from './ui';

const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
const selectEvento = document.getElementById('select-evento') as HTMLSelectElement;
const selectTipo = document.getElementById('select-tipo') as HTMLSelectElement;
const selectPais = document.getElementById('select-pais') as HTMLSelectElement;
const inputTop = document.getElementById('input-top') as HTMLInputElement;

// Inicializamos los selectores dinámicos al arrancar
inicializarSelectEventos(selectEvento, obtenerOpcionesEventos());
inicializarSelectPaises(selectPais, obtenerOpcionesPaises());

const ejecutarAnalisisRanking = async (): Promise<void> => {
    try {
        const limiteValidado = acotarLimite(
            inputTop.value,
            LIMITE_MINIMO_RANKING,
            LIMITE_MAXIMO_RANKING
        );
        inputTop.value = String(limiteValidado);

        const eventoSeleccionado = validarEventoWCA(selectEvento.value);
        const tipoSeleccionado: TipoRanking =
            selectTipo.value === 'average' ? 'average' : 'single';
        const paisSeleccionado = selectPais.value;

        toggleBoton(btnCargar, true);
        mostrarLoader();

        const rankingCrudo = await fetchRanking(eventoSeleccionado, tipoSeleccionado);

        const cantidadNecesaria =
            paisSeleccionado === 'All' ? limiteValidado : LIMITE_MAXIMO_RANKING;
        const muestraRanking = rankingCrudo.items.slice(0, cantidadNecesaria);

        const resultadoLotes = await fetchDetallesEnLotes(
            muestraRanking,
            TAMANO_LOTE_PETICIONES,
            (completados, total) => mostrarLoader(completados, total)
        );

        const resultado = procesarRankingCompleto(
            muestraRanking,
            resultadoLotes,
            paisSeleccionado,
            inputTop.value,
            eventoSeleccionado,
            tipoSeleccionado
        );

        inicializarSelectPaises(
            selectPais,
            resultado.opcionesPaisesActualizadas,
            paisSeleccionado
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