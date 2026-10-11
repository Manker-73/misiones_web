// Importamos solo el tipo
import type { Cuber } from './transformers'; 

// Capturamos el contenedor principal donde inyectaremos todo
const app = document.getElementById('app') as HTMLDivElement;

// Función para dar feedback visual al usuario
export const mostrarLoader = () => {
    app.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <h2>Analizando base de datos de la WCA...</h2>
            <p>Comprobando identidades de los competidores. Esto puede tardar unos segundos.</p>
        </div>
    `;
};

// Función para manejar fallos de red
export const mostrarError = (mensaje: string) => {
    app.innerHTML = `
        <div style="background-color: #ffebee; color: #c62828; padding: 1rem; border-radius: 8px;">
            <h3>Ha ocurrido un problema</h3>
            <p>${mensaje}</p>
        </div>
    `;
};

// Función principal de renderizado usando el método .map() del array
export const pintarResultados = (cubers: Cuber[]) => {
    // Control de arrays vacíos
    if (cubers.length === 0) {
        app.innerHTML = `
            <div style="padding: 1rem; border: 1px solid #ccc; border-radius: 8px;">
                <p>No se encontraron competidores para este criterio en la cima del ranking mundial.</p>
            </div>
        `;
        return;
    }

    // MAP: Transformamos el array de datos (Cuber[]) en un array de strings (HTML)
    // Luego usamos .join('') para convertir el array de strings en un solo bloque de texto HTML
    const html = cubers.map((cuber, index) => `
        <article style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="margin-top: 0; color: #2c3e50;">#${index + 1} - ${cuber.nombre}</h3>
            <div style="color: #666; margin-bottom: 10px;">
                <span style="display: block; margin-bottom: 5px;">👤 ID: ${cuber.id}</span>
                <span style="display: block;">🌍 País: ${cuber.pais}</span>
            </div>
            <p style="margin-bottom: 0; font-size: 1.2em; color: #e74c3c;">
                ⏱️ Tiempo: <strong>${cuber.tiempoS}</strong>
            </p>
        </article>
    `).join('');

    // Inyectamos todo el bloque HTML en el contenedor usando un grid
    app.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 20px;">
            ${html}
        </div>
    `;
};