import type { ResultadoProcesamiento } from '../types';

interface Props {
  resultado: ResultadoProcesamiento;
}

export function PanelEstadisticas({ resultado }: Props) {
  const {
    cubers,
    estadisticas,
    etiquetaPais,
    nombreEvento,
    tipoModalidad,
    fallidosRed,
    fallidosInexistentes
  } = resultado;

  if (!estadisticas) return null;

  const textoModalidad = tipoModalidad === 'single' ? 'Single' : 'Average';
  const metricas: Array<[string, string]> = [
    ['Tiempo medio:', estadisticas.mediaS],
    ['Mejor registro:', estadisticas.mejorS],
    ['Peor registro:', estadisticas.peorS],
    ['País dominante:', estadisticas.paisDominante],
    ['Países distintos:', String(estadisticas.totalPaisesDistintos)]
  ];

  const detallesAviso: string[] = [];
  if (fallidosRed > 0) {
    detallesAviso.push(`${fallidosRed} por fallo de red o timeout`);
  }
  if (fallidosInexistentes > 0) {
    detallesAviso.push(`${fallidosInexistentes} por perfil no disponible en la WCA`);
  }

  return (
    <section className="stats-panel">
      <h3 className="stats-title">
        📊 {nombreEvento} ({textoModalidad}) — Análisis de {etiquetaPais}
      </h3>

      <div className="stats-metrics">
        {metricas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="stat-box">
            <span className="stat-label">{etiqueta}</span>
            <strong className="stat-value">{valor}</strong>
          </div>
        ))}
      </div>

      {estadisticas.distribucionPaises.length > 0 && estadisticas.totalPaisesDistintos > 1 && (
        <div className="chart-container">
          <h4 className="chart-title">Top países</h4>
          {estadisticas.distribucionPaises.map(({ pais, cantidad, porcentaje }) => (
            <div key={pais} className="chart-row">
              <span className="chart-label">{pais}</span>
              <progress
                className="chart-bar"
                max={Math.max(cubers.length, 1)}
                value={cantidad}
              />
              <span className="chart-value">
                {cantidad} ({porcentaje}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {detallesAviso.length > 0 && (
        <p className="stats-warning">
          ⚠️ Perfiles omitidos: {detallesAviso.join(' y ')}.
        </p>
      )}
    </section>
  );
}