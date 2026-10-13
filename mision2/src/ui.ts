import type { Cuber } from './transformers';
import { nombresPaises } from './paises';

const app = document.getElementById('app') as HTMLDivElement;

// --- HELPERS PARA MANEJO DEL DOM ---
const crearElemento = (etiqueta: string, clases: string[] = [], texto: string = ''): HTMLElement => {
    const el = document.createElement(etiqueta);
    if (clases.length > 0) el.classList.add(...clases);
    if (texto) el.textContent = texto;
    return el;
};

// --- ESTADOS DE LA INTERFAZ ---
export const toggleBoton = (boton: HTMLButtonElement, estaCargando: boolean) => {
    boton.disabled = estaCargando;
    boton.textContent = estaCargando ? '⏳ Analizando...' : 'Analizar Récords';
    boton.style.opacity = estaCargando ? '0.5' : '1';
};

export const inicializarSelectPaises = (select: HTMLSelectElement) => {
    select.innerHTML = '<option value="All">🌍 Todo el mundo</option>';
    Object.entries(nombresPaises).forEach(([codigo, nombre]) => {
        select.appendChild(crearElemento('option', [], nombre)).setAttribute('value', codigo);
    });
};

export const mostrarLoader = () => {
    while (app.firstChild) app.removeChild(app.firstChild);
    const contenedor = crearElemento('div', ['mensaje-estado']);
    contenedor.append(
        crearElemento('h2', [], '⏳ Analizando base de datos de la WCA...'),
        crearElemento('p', [], 'Resolviendo identidades de los competidores. Esto puede tardar unos segundos.')
    );
    app.appendChild(contenedor);
};

export const mostrarError = (mensaje: string) => {
    while (app.firstChild) app.removeChild(app.firstChild);
    const contenedor = crearElemento('div', ['mensaje-error']);
    contenedor.append(
        crearElemento('h3', [], '❌ Ha ocurrido un problema'),
        crearElemento('p', [], mensaje)
    );
    app.appendChild(contenedor);
};

// --- RENDERIZADO PRINCIPAL ---
export const pintarResultados = (cubers: Cuber[], media: string | null, codigoPais: string) => {
    // 1. Limpiamos el contenedor visual
    while (app.firstChild) app.removeChild(app.firstChild);

    // 2. Control si el array está vacío tras filtrar
    if (cubers.length === 0) {
        app.appendChild(crearElemento('p', ['mensaje-estado'], 'No hay resultados para este filtro.'));
        return;
    }

    // 3. Inyectar el panel de estadísticas (Ahora personalizado por país)
    if (media) {
        // Lógica de traducción para el título del panel
        const nombrePais = codigoPais === 'All' ? 'todo el mundo' : (nombresPaises[codigoPais] || codigoPais);

        const statsPanel = crearElemento('div', ['stats-panel']);
        statsPanel.innerHTML = `<h3>📊 Análisis</h3><p>Tiempo medio de ${nombrePais}: <strong>${media}s</strong></p>`;
        statsPanel.style.cssText = 'background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #1565c0;';
        app.appendChild(statsPanel);
    }

    // 4. Crear la cuadrícula y las tarjetas
    const gridContainer = crearElemento('div', ['cuber-grid']);
    const tarjetasDOM = cubers.map((cuber, index) => {
        const article = crearElemento('article', ['cuber-card']);
        const nombrePais = nombresPaises[cuber.pais] || cuber.pais;
        
        article.innerHTML = `
            <h3 style="margin-top: 0;">#${index + 1} - ${cuber.nombre}</h3>
            <div style="color: #666; margin-bottom: 10px;">
                <span style="display: block; margin-bottom: 5px;">👤 ID: ${cuber.id}</span>
                <span style="display: block;">🌍 País: ${nombrePais}</span>
            </div>
            <p style="margin-bottom: 0; font-size: 1.2em; color: #e74c3c;">
                ⏱️ Tiempo: <strong>${cuber.tiempoS}</strong>
            </p>
        `;
        return article;
    });

    // 5. Ensamblar todo en el DOM
    gridContainer.append(...tarjetasDOM);
    app.appendChild(gridContainer);
};