// src/transformers.ts
import { formatearPorcentaje, formatearTiempoWCA } from './formatters';
import {
    obtenerEtiquetaFiltroPais,
    obtenerNombreEvento,
    obtenerNombrePais,
    obtenerOpcionesPaises
} from './paises';
import {
    LIMITE_DEFECTO_RANKING,
    LIMITE_MAXIMO_RANKING,
    LIMITE_MINIMO_RANKING,
    type CodigoEventoWCA,
    type Cuber,
    type DistribucionPais,
    type EstadisticasGrupo,
    type PersonDetails,
    type RankingItem,
    type ResultadoLotes,
    type ResultadoProcesamiento,
    type TipoRanking
} from './types';

export const acotarLimite = (
    valorRaw: string,
    min: number = LIMITE_MINIMO_RANKING,
    max: number = LIMITE_MAXIMO_RANKING
): number => {
    const parseado = Number.parseInt(valorRaw, 10);
    if (Number.isNaN(parseado)) return LIMITE_DEFECTO_RANKING;
    return Math.min(Math.max(parseado, min), max);
};

export const construirCuber = (item: RankingItem, detalle: PersonDetails): Cuber => {
    const codigo = detalle.country.trim().toUpperCase();
    return {
        id: item.personId,
        nombre: detalle.name,
        codigoPais: codigo,
        nombrePais: obtenerNombrePais(codigo),
        tiempoS: formatearTiempoWCA(item.best),
        tiempoMs: item.best
    };
};

export const filtrarPorPais = (cubers: Cuber[], codigoPais: string): Cuber[] => {
    if (codigoPais === 'All') return cubers;
    return cubers.filter((cuber) => cuber.codigoPais === codigoPais);
};

export const agruparPorPais = (cubers: Cuber[]): Record<string, number> =>
    cubers.reduce<Record<string, number>>((acc, cuber) => {
        acc[cuber.nombrePais] = (acc[cuber.nombrePais] || 0) + 1;
        return acc;
    }, {});

export const calcularDistribucionPaises = (
    conteoPaises: Record<string, number>,
    totalCubers: number,
    topN: number = 5
): DistribucionPais[] =>
    Object.entries(conteoPaises)
        .map(([pais, cantidad]) => ({
            pais,
            cantidad,
            porcentaje: formatearPorcentaje(cantidad, totalCubers)
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, topN);

export const calcularEstadisticas = (cubers: Cuber[]): EstadisticasGrupo | null => {
    if (cubers.length === 0) return null;

    const resumen = cubers.reduce(
        (acc, cuber) => {
            acc.sumaMs += cuber.tiempoMs;
            if (cuber.tiempoMs < acc.mejorMs) acc.mejorMs = cuber.tiempoMs;
            if (cuber.tiempoMs > acc.peorMs) acc.peorMs = cuber.tiempoMs;
            return acc;
        },
        { sumaMs: 0, mejorMs: Infinity, peorMs: -Infinity }
    );

    const conteoPaises = agruparPorPais(cubers);
    const entradasPaises = Object.entries(conteoPaises);

    const [paisMasFrecuente, cantidad] = entradasPaises.reduce(
        (maxActual, entrada) => (entrada[1] > maxActual[1] ? entrada : maxActual),
        entradasPaises[0]
    );

    const mediaCentesimas = resumen.sumaMs / cubers.length;
    const distribucionPaises = calcularDistribucionPaises(conteoPaises, cubers.length, 5);

    return {
        mediaS: formatearTiempoWCA(mediaCentesimas),
        mejorS: formatearTiempoWCA(resumen.mejorMs),
        peorS: formatearTiempoWCA(resumen.peorMs),
        paisDominante: `${paisMasFrecuente} (${cantidad})`,
        totalPaisesDistintos: entradasPaises.length,
        distribucionPaises
    };
};

export const procesarRankingCompleto = (
    items: RankingItem[],
    resultadoLotes: ResultadoLotes,
    codigoPais: string,
    limiteRaw: string,
    codigoEvento: CodigoEventoWCA,
    tipoModalidad: TipoRanking
): ResultadoProcesamiento => {
    const limiteSeguro = acotarLimite(limiteRaw);
    const { detallesPorId, fallidosRed, fallidosInexistentes } = resultadoLotes;

    const cubersOrdenados = items
        .filter((item) => Boolean(detallesPorId[item.personId]))
        .map((item) => construirCuber(item, detallesPorId[item.personId]))
        .sort((a, b) => a.tiempoMs - b.tiempoMs);

    const codigosPresentes = cubersOrdenados.map((cuber) => cuber.codigoPais);
    const opcionesPaisesActualizadas = obtenerOpcionesPaises(codigosPresentes);

    const cubersPorPais = filtrarPorPais(cubersOrdenados, codigoPais).slice(0, limiteSeguro);
    const estadisticas = calcularEstadisticas(cubersPorPais);

    return {
        cubers: cubersPorPais,
        estadisticas,
        etiquetaPais: obtenerEtiquetaFiltroPais(codigoPais),
        nombreEvento: obtenerNombreEvento(codigoEvento),
        tipoModalidad,
        fallidosRed,
        fallidosInexistentes,
        opcionesPaisesActualizadas
    };
};