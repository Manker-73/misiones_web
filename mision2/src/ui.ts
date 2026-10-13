import type { Cuber } from './transformers';
import { nombresPaises } from './paises';

const app = document.getElementById('app') as HTMLDivElement;

// Helper: Crear elementos (mantén el tuyo igual)
const crearElemento = (etiqueta: string, clases: string[] = [], texto: string = ''): HTMLElement => {
    const el = document.createElement(etiqueta);
    if (clases.length > 0) el.classList.add(...clases);
    if (texto) el.textContent = texto;
    return el;
};

// NUEVO: Bloqueo del botón
export const toggleBoton = (boton: HTMLButtonElement, estaCargando: boolean) => {
    boton.disabled = estaCargando;
    boton.textContent = estaCargando ? '⏳ Analizando...' : 'Analizar Récords';
    boton.style.opacity = estaCargando ? '0.5' : '1';
};

// NUEVO: Generación dinámica del <select>
export const inicializarSelectPaises = (select: HTMLSelectElement) => {
    select.innerHTML = '<option value="All">🌍 Todo el mundo</option>';
    Object.entries(nombresPaises).forEach(([codigo, nombre]) => {
        select.appendChild(crearElemento('option', [], nombre)).setAttribute('value', codigo);
    });
};

// Funciones de error y loader (mantén las que tenías)
export const mostrarLoader = () => { /* ... tu código ... */ };
export const mostrarError = (mensaje: string) => { /* ... tu código ... */ };


// Añadimos codigoPais: string a los parámetros
export const pintarResultados = (cubers: Cuber[], media: string | null, codigoPais: string) => {
    while (app.firstChild) app.removeChild(app.firstChild);

    if (cubers.length === 0) {
        app.appendChild(crearElemento('p', ['mensaje-estado'], 'No hay resultados para este filtro.'));
        return;
    }

    if (media) {
        const nombrePais = codigoPais === 'All' ? 'todo el mundo' : (nombresPaises[codigoPais] || codigoPais);

        const statsPanel = crearElemento('div', ['stats-panel']);

        statsPanel.innerHTML = `<h3>📊 Análisis</h3><p>Tiempo medio de ${nombrePais}: <strong>${media}s</strong></p>`;
        statsPanel.style.cssText = 'background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #1565c0;';
        app.appendChild(statsPanel);
    }

    const gridContainer = crearElemento('div', ['cuber-grid']);
    const tarjetasDOM = cubers.map((cuber, index) => {
        const article = crearElemento('article', ['cuber-card']);
        article.innerHTML = `
            <h3 style="margin-top: 0;">#${index + 1} - ${cuber.nombre}</h3>
            <p>👤 ID: ${cuber.id}<br>🌍 País: ${nombresPaises[cuber.pais] || cuber.pais}</p>
            <p style="color: #e74c3c;">⏱️ <strong>${cuber.tiempoS}</strong></p>
        `;
        return article;
    });

    gridContainer.append(...tarjetasDOM);
    app.appendChild(gridContainer);
};