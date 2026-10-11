import './style.css';
import { fetchRanking } from './api';
import { limpiarDatos, filtrarPorPais, calcularMediaTop } from './transformers';
import { mostrarLoader, pintarResultados, mostrarError } from './ui';

const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
const selectPais = document.getElementById('select-pais') as HTMLSelectElement;

btnCargar.addEventListener('click', async () => {
  try {
      mostrarLoader();
      
      // 1. Traer ranking (solo IDs y tiempos)
      const rankingCrudo = await fetchRanking('333', 'single');
      
      // 2. Extraer solo el Top 10 (para no sobrecargar la red con cientos de peticiones)
      const top10Crudo = rankingCrudo.items.slice(0, 10);
      
      // 3. Cruzar datos (Camino B: Promise.all)
      // Por cada elemento del top 10, disparamos una petición secundaria simultánea
      const datosConNombresPromises = top10Crudo.map(async (item: any) => {
          const detalles = await fetchCuberDetails(item.personId);
          return {
              id: item.personId,
              // Si la petición falla, ponemos un nombre por defecto
              nombre: detalles ? detalles.name : "Nombre desconocido",
              pais: detalles ? detalles.country : "País desconocido",
              tiempoS: (item.best / 100).toFixed(2) + "s",
              tiempoMs: item.best
          };
      });

      // Esperamos a que TODAS las peticiones secundarias terminen
      const datosLimpios = await Promise.all(datosConNombresPromises);
      
      // 4. Aplicar el filtro por país seleccionado
      const pais = selectPais.value;
      const datosFiltrados = filtrarPorPais(datosLimpios, pais);
      
      // 5. Análisis matemático
      calcularMediaTop(datosFiltrados);

      // 6. Renderizar
      pintarResultados(datosFiltrados);

  } catch (error) {
      console.error(error);
      mostrarError("Hubo un problema al contactar con la API de la WCA.");
  }
});