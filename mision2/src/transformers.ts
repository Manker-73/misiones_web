import { nombresPaises } from './paises';
import {
    EVENTOS_WCA,
    LIMITE_DEFECTO_RANKING,
    LIMITE_MAXIMO_RANKING,
    LIMITE_MINIMO_RANKING,
    type CodigoEventoWCA,
    type Cuber,
    type EstadisticasGrupo,
    type OpcionEventoWCA,
    type OpcionPais,
    type PersonDetails,
    type RankingItem,
    type ResultadoLotes,
    type ResultadoProcesamiento,
    type TipoRanking
} from './types';

export const obtenerOpcionesEventos = (): readonly OpcionEventoWCA[] => EVENTOS_WCA;

export const validarEventoWCA = (valor: string): CodigoEventoWCA => {
    const encontrado = EVENTOS_WCA.find((ev) => ev.codigo === valor);
    return encontrado ? encontrado.codigo : '333';
};

export const obtenerNombreEvento = (codigo: CodigoEventoWCA): string => {
    const encontrado = EVENTOS_WCA.find((ev) => ev.codigo === codigo);
    return encontrado ? encontrado.nombre : codigo;
};

// Formatea centésimas de segundo al estándar WCA 
export const formatearTiempoWCA = (centesimas: number): string => {
    const totalSegundos = centesimas / 100;
    if (totalSegundos < 60) {
        return `${totalSegundos.toFixed(2)}s`;
    }
    const minutos = Math.floor(totalSegundos / 60);
    const segundosRestantes = (totalSegundos % 60).toFixed(2).padStart(5, '0');
    return `${minutos}:${segundosRestantes}`;
};

export const obtenerOpcionesPaises = (codigosExtra: string[] = []): OpcionPais[] => {
    const mapaCombinado: Record<string, string> = { ...nombresPaises };

    codigosExtra.forEach((codigo) => {
        const codigoNormalizado = codigo.trim().toUpperCase();
        if (codigoNormalizado && !mapaCombinado[codigoNormalizado]) {
            mapaCombinado[codigoNormalizado] = `País (${codigoNormalizado})`;
        }
    });

    return Object.entries(mapaCombinado)
        .map(([codigo, nombre]) => ({ codigo, nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
};

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
        nombrePais: nombresPaises[codigo] || `País (${codigo})`,
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
    const entradasPaises = Object.entries(conteoPaises);

    const [paisMasFrecuente, cantidad] = entradasPaises.reduce(
        (maxActual, entrada) => (entrada[1] > maxActual[1] ? entrada : maxActual),
        entradasPaises[0]
    );

    const mediaCentesimas = resumen.sumaMs / cubers.length;

    return {
        mediaS: formatearTiempoWCA(mediaCentesimas),
        mejorS: formatearTiempoWCA(resumen.mejorMs),
        peorS: formatearTiempoWCA(resumen.peorMs),
        paisDominante: `${paisMasFrecuente} (${cantidad})`,
        totalPaisesDistintos: entradasPaises.length
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

    const cubersValidos = items
        .flatMap((item) => {
            const detalle = detallesPorId[item.personId];
            return detalle ? [construirCuber(item, detalle)] : [];
        })
        .sort((a, b) => a.tiempoMs - b.tiempoMs);

    const codigosPresentes = cubersValidos.map((cuber) => cuber.codigoPais);
    const opcionesPaisesActualizadas = obtenerOpcionesPaises(codigosPresentes);

    const cubersPorPais = filtrarPorPais(cubersValidos, codigoPais).slice(0, limiteSeguro);
    const estadisticas = calcularEstadisticas(cubersPorPais);
    const etiquetaPais =
        codigoPais === 'All'
            ? 'todo el mundo'
            : (nombresPaises[codigoPais] || `País (${codigoPais})`);

    return {
        cubers: cubersPorPais,
        estadisticas,
        etiquetaPais,
        nombreEvento: obtenerNombreEvento(codigoEvento),
        tipoModalidad,
        fallidosRed,
        fallidosInexistentes,
        opcionesPaisesActualizadas
    };
};