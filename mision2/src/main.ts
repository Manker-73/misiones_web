import './style.css';
import {
    ConsultaCanceladaError,
    fetchDetallesEnLotes,
    fetchRanking
} from './api';
import {
    obtenerOpcionesEventos,
    obtenerOpcionesPaises,
    validarEventoWCA
} from './paises';
import {
    acotarLimite,
    procesarRankingCompleto
} from './transformers';
import {
    LIMITE_MAXIMO_RANKING,
    LIMITE_MINIMO_RANKING,
    TAMANO_LOTE_PETICIONES,
    type TipoRanking
} from './types';
import {
    inicializarSelectEventos,
    inicializarSelectPaises,
    mostrarCancelado,
    mostrarError,
    mostrarLoader,
    pintarResultados,
    toggleEstadoCarga
} from './ui';

const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
const btnCancelar = document.getElementById('btn-cancelar') as HTMLButtonElement;
const selectEvento = document.getElementById('select-evento') as HTMLSelectElement;
const selectTipo = document.getElementById('select-tipo') as HTMLSelectElement;
const selectPais = document.getElementById('select-pais') as HTMLSelectElement;
const inputTop = document.getElementById('input-top') as HTMLInputElement;

inicializarSelectEventos(selectEvento, obtenerOpcionesEventos());
inicializarSelectPaises(selectPais, obtenerOpcionesPaises());

let controladorActivo: AbortController | null = null;

const abortarConsultaActiva = (): void => {
    if (controladorActivo) {
        controladorActivo.abort();
        controladorActivo = null;
    }
};

const ejecutarAnalisisRanking = async (): Promise<void> => {
    // Si había una consulta previa en curso, la abortamos antes de abrir la nueva
    abortarConsultaActiva();

    const controller = new AbortController();
    controladorActivo = controller;
    const { signal } = controller;

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

        toggleEstadoCarga(btnCargar, btnCancelar, true);
        mostrarLoader();

        const rankingCrudo = await fetchRanking(
            eventoSeleccionado,
            tipoSeleccionado,
            signal
        );

        const cantidadNecesaria =
            paisSeleccionado === 'All' ? limiteValidado : LIMITE_MAXIMO_RANKING;
        const muestraRanking = rankingCrudo.items.slice(0, cantidadNecesaria);

        const resultadoLotes = await fetchDetallesEnLotes(
            muestraRanking,
            TAMANO_LOTE_PETICIONES,
            (completados, total) => {
                if (!signal.aborted) {
                    mostrarLoader(completados, total);
                }
            },
            signal
        );

        if (signal.aborted) {
            throw new ConsultaCanceladaError();
        }

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
        // Si esta consulta fue reemplazada por otra nueva, ignoramos su cierre visual
        if (controladorActivo !== null && controladorActivo !== controller) {
            return;
        }
        if (error instanceof ConsultaCanceladaError || signal.aborted) {
            mostrarCancelado();
            return;
        }
        console.error('Fallo en la orquestación:', error);
        const mensaje =
            error instanceof Error
                ? error.message
                : 'Error inesperado al procesar los datos de la WCA.';
        mostrarError(mensaje);
    } finally {
        if (controladorActivo === controller) {
            controladorActivo = null;
        }
        // Si no hay ninguna consulta nueva en vuelo, rehabilitamos siempre el botón
        if (controladorActivo === null) {
            toggleEstadoCarga(btnCargar, btnCancelar, false);
        }
    }
};

btnCargar.addEventListener('click', ejecutarAnalisisRanking);

btnCancelar.addEventListener('click', () => {
    abortarConsultaActiva();
    toggleEstadoCarga(btnCargar, btnCancelar, false);
    mostrarCancelado();
});

[selectEvento, selectTipo, selectPais].forEach((selector) => {
    selector.addEventListener('change', () => {
        if (controladorActivo) {
            ejecutarAnalisisRanking();
        }
    });
});