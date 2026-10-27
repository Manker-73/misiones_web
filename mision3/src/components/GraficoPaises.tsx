import type { DistribucionPais } from '../types';

interface Props {
  distribucion: DistribucionPais[];
  totalMostrados: number;
}

export function GraficoPaises({ distribucion, totalMostrados }: Props) {
  return (
    <div className="chart-container">
      <h4 className="chart-title">Top países</h4>
      {distribucion.map(({ pais, cantidad, porcentaje }) => (
        <div key={pais} className="chart-row">
          <span className="chart-label">{pais}</span>
          <progress
            className="chart-bar"
            max={Math.max(totalMostrados, 1)}
            value={cantidad}
          />
          <span className="chart-value">
            {cantidad} ({porcentaje}%)
          </span>
        </div>
      ))}
    </div>
  );
}