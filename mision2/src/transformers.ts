// src/transformers.ts
import type { PersonDetails, RankingItem } from './api';
import { nombresPaises } from './paises';

export interface Cuber {
    id: string;
    nombre: string;
    codigoPais: string;
    nombrePais: string;
    tiempoS: string;
    tiempoMs: number;
}

export interface EstadisticasGrupo {
    mediaS: string;
    mejorS: string;
    peorS: string;
    paisDominante: string;
    totalPaisesDistintos: number;
}

export interface OpcionPais {
    codigo: string;
    nombre: string;
}

export interface ResultadoProcesamiento {
    cubers: Cuber[];
    estadisticas: EstadisticasGrupo | null;
    etiquetaPais: string;
    perfilesFallidos: number;
}

export const obtenerOpcionesPaises = (): OpcionPais[] =>
    Object.entries(nombresPaises)
        .map(([codigo, nombre]) => ({ codigo, nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

export const acotarLimite = (valorRaw: string, min: number = 1, max: number = 1000  ): number => {
    const parseado = Number.parseInt(valorRaw, 10);
    if (Number.isNaN(parseado)) return 50;
    return Math.min(Math.max(parseado, min), max);
};

export const construirCuber = (item: RankingItem, detalle: PersonDetails): Cuber => ({
    id: item.personId,
    nombre: detalle.name,
    codigoPais: detalle.country,
    nombrePais: nombresPaises[detalle.country] || detalle.country,
    tiempoS: `${(item.best / 100).toFixed(2)}s`,
    tiempoMs: item.best
});

export const filtrarPorPais = (cubers: Cuber[], codigoPais: string): Cuber[] => {
    if (codigoPais === 'All') return cubers;
    return cubers.filter((cuber) => cuber.codigoPais === codigoPais);
};

export const agruparPorPais = (cubers: Cuber[]): Record<string, number> =>
    cubers.reduce<Record<string, number>>((acc, cuber) => {
        acc[cuber.nombrePais] = (acc[cuber.nombrePais] || 0) + 1;
        return acc;
    }, {});

export const calcularEstadisticas = (cubers: Cuber[]): EstadisticasGrupo | null => {
    if (cubers.length === 0) return null;

    const resumen = cubers.reduce(
        (acc, cuber) => ({
            sumaMs: acc.sumaMs + cuber.tiempoMs,
            mejorMs: Math.min(acc.mejorMs, cuber.tiempoMs),
            peorMs: Math.max(acc.peorMs, cuber.tiempoMs)
        }),
        { sumaMs: 0, mejorMs: Infinity, peorMs: -Infinity }
    );

    const conteoPaises = agruparPorPais(cubers);
    const paisesOrdenados = Object.entries(conteoPaises).sort((a, b) => b[1] - a[1]);
    const [paisMasFrecuente, cantidad] = paisesOrdenados[0];

    return {
        mediaS: (resumen.sumaMs / cubers.length / 100).toFixed(2),
        mejorS: (resumen.mejorMs / 100).toFixed(2),
        peorS: (resumen.peorMs / 100).toFixed(2),
        paisDominante: `${paisMasFrecuente} (${cantidad})`,
        totalPaisesDistintos: paisesOrdenados.length
    };
};

// Función de servicio que encapsula todo el pipeline de transformación
export const procesarRankingCompleto = (
    items: RankingItem[],
    detallesPorId: Record<string, PersonDetails>,
    codigoPais: string,
    limiteRaw: string,
    perfilesFallidos: number
): ResultadoProcesamiento => {
    const limiteSeguro = acotarLimite(limiteRaw, 1, 1000);

    // Encadenamiento funcional: filtrar perfiles válidos -> construir objetos -> ordenar por tiempo -> filtrar por país -> recortar
    const cubersFiltrados = items
        .filter((item) => Boolean(detallesPorId[item.personId]))
        .map((item) => construirCuber(item, detallesPorId[item.personId]))
        .sort((a, b) => a.tiempoMs - b.tiempoMs);

    const cubersPorPais = filtrarPorPais(cubersFiltrados, codigoPais).slice(0, limiteSeguro);
    const estadisticas = calcularEstadisticas(cubersPorPais);
    const etiquetaPais =
        codigoPais === 'All' ? 'todo el mundo' : (nombresPaises[codigoPais] || codigoPais);

    return {
        cubers: cubersPorPais,
        estadisticas,
        etiquetaPais,
        perfilesFallidos
    };
};