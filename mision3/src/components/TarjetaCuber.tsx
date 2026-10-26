import type { Cuber } from '../types';

interface Props {
  cuber: Cuber;
  index: number;
}

const obtenerInsigniaPosicion = (posicion: number): string => {
  if (posicion === 1) return '🥇 #1';
  if (posicion === 2) return '🥈 #2';
  if (posicion === 3) return '🥉 #3';
  return `#${posicion}`;
};

export function TarjetaCuber({ cuber, index }: Props) {
  const posicion = index + 1;
  const clasePodio = posicion <= 3 ? ` podium-${posicion}` : '';

  return (
    <article className={`cuber-card${clasePodio}`}>
      <div className="cuber-card-header">
        <span className="cuber-rank">{obtenerInsigniaPosicion(posicion)}</span>
        <strong className="cuber-time">⏱️ {cuber.tiempoS}</strong>
      </div>
      <h3 className="cuber-title">{cuber.nombre}</h3>
      <div className="cuber-info">
        <span>👤 ID: {cuber.id}</span>
        <span>País: {cuber.nombrePais}</span>
      </div>
    </article>
  );
}

export default TarjetaCuber;