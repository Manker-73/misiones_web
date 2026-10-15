import type {
    Cuber,
    OpcionEventoWCA,
    OpcionPais,
    ResultadoProcesamiento
} from './types';

const obtenerContenedorApp = (): HTMLDivElement => {
    const contenedor = document.getElementById('app') as HTMLDivElement | null;
    if (!contenedor) {
        throw new Error('No se encontró el contenedor #app en el documento.');
    }
    return contenedor;
};

const crearElemento = <K extends keyof HTMLElementTagNameMap>(
    etiqueta: K,
    clases: string[] = [],
    texto: string = ''
): HTMLElementTagNameMap[K] => {
    const el = document.createElement(etiqueta);
    if (clases.length > 0) el.classList.add(...clases);
    if (texto) el.textContent = texto;
    return el;
};

export const toggleBoton = (boton: HTMLButtonElement, estaCargando: boolean): void => {
    boton.disabled = estaCargando;
    boton.textContent = estaCargando ? '⏳ Analizando...' : 'Analizar Récords';
    boton.classList.toggle('btn-deshabilitado', estaCargando);
};

export const inicializarSelectEventos = (
    select: HTMLSelectElement,
    eventos: readonly OpcionEventoWCA[]
): void => {
    const opcionesDOM = eventos.map(({ codigo, nombre }) => {
        const option = crearElemento('option', [], nombre);
        option.value = codigo;
        return option;
    });
    select.replaceChildren(...opcionesDOM);
};

export const inicializarSelectPaises = (
    select: HTMLSelectElement,
    opciones: OpcionPais[],
    seleccionPrevia: string = 'All'
): void => {
    const opcionGlobal = crearElemento('option', [], 'Todo el mundo 🌍');
    opcionGlobal.value = 'All';

    const elementosOpcion = opciones.map(({ codigo, nombre }) => {
        const option = crearElemento('option', [], nombre);
        option.value = codigo;
        return option;
    });

    select.replaceChildren(opcionGlobal, ...elementosOpcion);
    select.value = opciones.some((op) => op.codigo === seleccionPrevia)
        ? seleccionPrevia
        : 'All';
};

export const mostrarLoader = (completados: number = 0, total: number = 0): void => {
    const app = obtenerContenedorApp();
    const contenedor = crearElemento('div', ['mensaje-estado']);
    const titulo = crearElemento('h2', [], '⏳ Analizando base de datos de la WCA...');
    const textoProgreso =
        total > 0
            ? `Resolviendo identidades en lotes seguros: ${completados} de ${total} perfiles procesados.`
            : 'Conectando con el repositorio de rankings mundiales...';
    const subtitulo = crearElemento('p', ['progreso-texto'], textoProgreso);

    contenedor.append(titulo, subtitulo);
    app.replaceChildren(contenedor);
};

export const mostrarError = (mensaje: string): void => {
    const app = obtenerContenedorApp();
    const contenedor = crearElemento('div', ['mensaje-error']);
    contenedor.append(
        crearElemento('h3', [], '❌ Ha ocurrido un problema'),
        crearElemento('p', [], mensaje)
    );
    app.replaceChildren(contenedor);
};

const construirPanelEstadisticas = (resultado: ResultadoProcesamiento): HTMLElement => {
    const {
        estadisticas,
        etiquetaPais,
        nombreEvento,
        tipoModalidad,
        fallidosRed,
        fallidosInexistentes
    } = resultado;

    const textoModalidad = tipoModalidad === 'single' ? 'Single' : 'Average';
    const panel = crearElemento('section', ['stats-panel']);
    const titulo = crearElemento(
        'h3',
        ['stats-title'],
        `📊 ${nombreEvento} (${textoModalidad}) — Análisis de ${etiquetaPais}`
    );

    const listaMetricas = crearElemento('div', ['stats-metrics']);

    if (estadisticas) {
        const items: Array<[string, string]> = [
            ['Tiempo medio:', estadisticas.mediaS],
            ['Mejor registro:', estadisticas.mejorS],
            ['Peor registro:', estadisticas.peorS],
            ['País dominante:', estadisticas.paisDominante],
            ['Países distintos:', String(estadisticas.totalPaisesDistintos)]
        ];

        const nodosMetrica = items.map(([etiqueta, valor]) => {
            const box = crearElemento('div', ['stat-box']);
            const labelSpan = crearElemento('span', ['stat-label'], etiqueta);
            const strongValor = crearElemento('strong', ['stat-value'], valor);
            box.append(labelSpan, strongValor);
            return box;
        });

        listaMetricas.append(...nodosMetrica);
    }

    panel.append(titulo, listaMetricas);

    if (fallidosRed > 0 || fallidosInexistentes > 0) {
        const detallesAviso: string[] = [];
        if (fallidosRed > 0) {
            detallesAviso.push(`${fallidosRed} por fallo de red o timeout`);
        }
        if (fallidosInexistentes > 0) {
            detallesAviso.push(`${fallidosInexistentes} por perfil no disponible en la WCA`);
        }
        const aviso = crearElemento(
            'p',
            ['stats-warning'],
            `⚠️ Perfiles omitidos: ${detallesAviso.join(' y ')}.`
        );
        panel.appendChild(aviso);
    }

    return panel;
};

const obtenerInsigniaPosicion = (posicion: number): string => {
    if (posicion === 1) return '🥇 #1';
    if (posicion === 2) return '🥈 #2';
    if (posicion === 3) return '🥉 #3';
    return `#${posicion}`;
};

const construirTarjetaCuber = (cuber: Cuber, index: number): HTMLElement => {
    const posicion = index + 1;
    const clases = ['cuber-card'];
    if (posicion <= 3) clases.push(`podium-${posicion}`);

    const article = crearElemento('article', clases);

    const headerCard = crearElemento('div', ['cuber-card-header']);
    const rankBadge = crearElemento('span', ['cuber-rank'], obtenerInsigniaPosicion(posicion));
    const timeBadge = crearElemento('strong', ['cuber-time'], `⏱️ ${cuber.tiempoS}`);
    headerCard.append(rankBadge, timeBadge);

    const titulo = crearElemento('h3', ['cuber-title'], cuber.nombre);

    const divInfo = crearElemento('div', ['cuber-info']);
    const idSpan = crearElemento('span', [], `👤 ID: ${cuber.id}`);
    const paisSpan = crearElemento('span', [], `País: ${cuber.nombrePais}`);
    divInfo.append(idSpan, paisSpan);

    article.append(headerCard, titulo, divInfo);
    return article;
};

export const pintarResultados = (resultado: ResultadoProcesamiento): void => {
    const app = obtenerContenedorApp();
    const { cubers, estadisticas } = resultado;

    if (cubers.length === 0) {
        const vacio = crearElemento(
            'div',
            ['mensaje-estado'],
            'No se encontraron competidores para este país dentro del rango analizado.'
        );
        app.replaceChildren(vacio);
        return;
    }

    const fragmentos: HTMLElement[] = [];

    if (estadisticas) {
        fragmentos.push(construirPanelEstadisticas(resultado));
    }

    const gridContainer = crearElemento('div', ['cuber-grid']);
    const tarjetasDOM = cubers.map((cuber, index) => construirTarjetaCuber(cuber, index));
    gridContainer.append(...tarjetasDOM);
    fragmentos.push(gridContainer);

    app.replaceChildren(...fragmentos);
};