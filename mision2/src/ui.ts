// Importamos la interfaz para tipar el parámetro
import type { Cuber } from './transformers';

const app = document.getElementById('app') as HTMLDivElement;

export const mostrarLoader = () => {
    app.innerHTML = '<p>⏳ Cargando récords mundiales...</p>';
};

export const mostrarError = (mensaje: string) => {
    app.innerHTML = `<p style="color: red;">❌ ${mensaje}</p>`;
};

export const pintarResultados = (cubers: Cuber[]) => {
    // Robustez: Si el país no tiene competidores o el filtro falla
    if (cubers.length === 0) {
        app.innerHTML = '<p>No se encontraron competidores para este criterio.</p>';
        return;
    }

    // Para no saturar el DOM, mostramos un Top 50 máximo
    const top50 = cubers.slice(0, 50);

    // Creamos las tarjetas sin usar un bucle `for`, usando `.map` y `.join('')`
    const html = top50.map((cuber, index) => `
        <article style="border: 1px solid #ccc; padding: 10px; margin: 5px; border-radius: 8px;">
            <h3>#${index + 1} - ${cuber.nombre}</h3>
            <p>🌍 País: ${cuber.pais}</p>
            <p>⏱️ Tiempo: <strong>${cuber.tiempoS}</strong></p>
        </article>
    `).join('');

    app.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
        ${html}
    </div>`;
};