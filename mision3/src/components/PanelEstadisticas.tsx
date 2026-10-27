// src/components/PanelEstadisticas.tsx
import type { EstadisticasGrupo, TipoRanking } from '../types';
import { GraficoPaises } from './GraficoPaises';

interface Props {
  estadisticas: EstadisticasGrupo;
  totalMostrados: number;
  etiquetaPais: string;
  nombreEvento: string;
  tipoModalidad: TipoRanking;
  fallidosRed: number;
  fallidosInexistentes: number;
}

export function PanelEstadisticas({
  estadisticas,
  totalMostrados,
  etiquetaPais,
  nombreEvento,
  tipoModalidad,
  fallidosRed,
  fallidosInexistentes
}: Props) {
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

      {estadisticas.distribucionPaises.length > 0 &&
        estadisticas.totalPaisesDistintos > 1 && (
          <GraficoPaises
            distribucion={estadisticas.distribucionPaises}
            totalMostrados={totalMostrados}
          />
        )}

      {detallesAviso.length > 0 && (
        <p className="stats-warning">
          ⚠️ Perfiles omitidos: {detallesAviso.join(' y ')}.
        </p>
      )}
    </section>
  );
}