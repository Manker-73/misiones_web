import type { Cuber } from './transformers';

const app = document.getElementById('app') as HTMLDivElement;

// Diccionario de traducción visual
const nombresPaises: { [key: string]: string } = {
    'ES': 'España',
    'US': 'Estados Unidos',
    'CN': 'China',
    'PL': 'Polonia',
    'KR': 'Corea del Sur',
    'AU': 'Australia',
    'FR': 'Francia'
};

// --- HELPERS (Funciones de ayuda para no escribir HTML en crudo) ---

// Función para vaciar el contenedor de forma segura
const limpiarContenedor = () => {
    while (app.firstChild) {
        app.removeChild(app.firstChild);
    }
};

// Función para crear un elemento HTML con atributos
const crearElemento = (etiqueta: string, clases: string[] = [], texto: string = ''): HTMLElement => {
    const el = document.createElement(etiqueta);
    if (clases.length > 0) el.classList.add(...clases);
    if (texto) el.textContent = texto;
    return el;
};

// Función específica para construir la tarjeta de un Cuber
const construirTarjetaCuber = (cuber: Cuber, index: number): HTMLElement => {
    const paisFormateado = nombresPaises[cuber.pais] || cuber.pais;

    const article = crearElemento('article', ['cuber-card']);
    
    const titulo = crearElemento('h3', [], `#${index + 1} - ${cuber.nombre}`);
    
    const divInfo = crearElemento('div', ['cuber-info']);
    const idSpan = crearElemento('span', [], `👤 ID: ${cuber.id}`);
    const paisSpan = crearElemento('span', [], `🌍 País: ${paisFormateado}`);
    
    const tiempoP = crearElemento('p', ['cuber-time']);
    tiempoP.innerHTML = `⏱️ Tiempo: <strong>${cuber.tiempoS}</strong>`; // El único innerHTML justificado por el negrita

    // Ensamblamos la tarjeta
    divInfo.append(idSpan, paisSpan);
    article.append(titulo, divInfo, tiempoP);
    
    return article;
};

// --- FUNCIONES EXPORTADAS (Tu API pública de la interfaz) ---

export const mostrarLoader = () => {
    limpiarContenedor();
    const contenedor = crearElemento('div', ['mensaje-estado']);
    contenedor.append(
        crearElemento('h2', [], '⏳ Analizando base de datos de la WCA...'),
        crearElemento('p', [], 'Resolviendo identidades de los competidores. Esto puede tardar unos segundos.')
    );
    app.appendChild(contenedor);
};

export const mostrarError = (mensaje: string) => {
    limpiarContenedor();
    const contenedor = crearElemento('div', ['mensaje-error']);
    contenedor.append(
        crearElemento('h3', [], '❌ Ha ocurrido un problema'),
        crearElemento('p', [], mensaje)
    );
    app.appendChild(contenedor);
};

export const pintarResultados = (cubers: Cuber[]) => {
    limpiarContenedor();

    if (cubers.length === 0) {
        const mensajeVacio = crearElemento('div', ['mensaje-estado']);
        mensajeVacio.appendChild(crearElemento('p', [], 'No se encontraron competidores para este criterio en la cima del ranking mundial.'));
        app.appendChild(mensajeVacio);
        return;
    }

    // Creamos el contenedor Grid principal
    const gridContainer = crearElemento('div', ['cuber-grid']);

    // MAP: Transformamos el array de datos en un array de Elementos DOM reales
    const tarjetasDOM = cubers.map((cuber, index) => construirTarjetaCuber(cuber, index));

    // Añadimos todas las tarjetas al contenedor usando sintaxis spread (muy idiomático y eficiente)
    gridContainer.append(...tarjetasDOM);
    
    // Añadimos el grid al DOM principal
    app.appendChild(gridContainer);
};