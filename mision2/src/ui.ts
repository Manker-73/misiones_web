// src/ui.ts
import type { Cuber, OpcionPais, ResultadoProcesamiento } from './transformers';

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

export const inicializarSelectPaises = (
    select: HTMLSelectElement,
    opciones: OpcionPais[]
): void => {
    const opcionGlobal = crearElemento('option', [], '🌍 Todo el mundo');
    opcionGlobal.value = 'All';

    const elementosOpcion = opciones.map(({ codigo, nombre }) => {
        const option = crearElemento('option', [], nombre);
        option.value = codigo;
        return option;
    });

    select.replaceChildren(opcionGlobal, ...elementosOpcion);
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
    const { estadisticas, etiquetaPais, perfilesFallidos } = resultado;
    const panel = crearElemento('section', ['stats-panel']);
    const titulo = crearElemento('h3', ['stats-title'], `📊 Análisis(${etiquetaPais})`);

    const listaMetricas = crearElemento('div', ['stats-metrics']);

    if (estadisticas) {
        const items: Array<[string, string]> = [
            ['Tiempo medio:', `${estadisticas.mediaS}s`],
            ['Mejor registro:', `${estadisticas.mejorS}s`],
            ['Peor registro:', `${estadisticas.peorS}s`],
            ['País dominante:', estadisticas.paisDominante]
        ];

        const nodosMetrica = items.map(([etiqueta, valor]) => {
            const p = crearElemento('p', ['stats-item'], `${etiqueta} `);
            const strong = crearElemento('strong', [], valor);
            p.appendChild(strong);
            return p;
        });

        listaMetricas.append(...nodosMetrica);
    }

    panel.append(titulo, listaMetricas);

    if (perfilesFallidos > 0) {
        const aviso = crearElemento(
            'p',
            ['stats-warning'],
            `⚠️ Se omitieron ${perfilesFallidos} perfiles que no respondieron a tiempo.`
        );
        panel.appendChild(aviso);
    }

    return panel;
};

const construirTarjetaCuber = (cuber: Cuber, index: number): HTMLElement => {
    const article = crearElemento('article', ['cuber-card']);
    const titulo = crearElemento('h3', ['cuber-title'], `#${index + 1} - ${cuber.nombre}`);

    const divInfo = crearElemento('div', ['cuber-info']);
    const idSpan = crearElemento('span', [], `👤 ID: ${cuber.id}`);
    const paisSpan = crearElemento('span', [], `🌍 País: ${cuber.nombrePais}`);
    divInfo.append(idSpan, paisSpan);

    const tiempoP = crearElemento('p', ['cuber-time'], '⏱️ Tiempo: ');
    const tiempoStrong = crearElemento('strong', [], cuber.tiempoS);
    tiempoP.appendChild(tiempoStrong);

    article.append(titulo, divInfo, tiempoP);
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