import type { EstadoVista } from '../hooks/useWcaRanking';
import { BarraProgreso } from './BarraProgreso';
import { PanelEstadisticas } from './PanelEstadisticas';
import { TarjetaCuber } from './TarjetaCuber';

interface Props {
  vista: EstadoVista;
}

export function VistaResultado({ vista }: Props) {
  switch (vista.tipo) {
    case 'inicial':
      return (
        <div className="mensaje-estado">
          <p>
            Selecciona la categoría, la modalidad y el país, y haz clic en{' '}
            <strong>Analizar Récords</strong>.
          </p>
        </div>
      );

    case 'cargando':
      return (
        <BarraProgreso
          completados={vista.completados}
          total={vista.total}
        />
      );

    case 'cancelado':
      return (
        <div className="mensaje-estado">
          <h3>⏹️ Consulta cancelada</h3>
          <p>
            Se abortaron las peticiones en curso. Ajusta los filtros y pulsa Analizar Récords.
          </p>
        </div>
      );

    case 'error':
      return (
        <div className="mensaje-error">
          <h3>❌ Ha ocurrido un problema</h3>
          <p>{vista.mensaje}</p>
        </div>
      );

    case 'exito': {
      const {
        cubers,
        estadisticas,
        etiquetaPais,
        nombreEvento,
        tipoModalidad,
        fallidosRed,
        fallidosInexistentes
      } = vista.resultado;

      if (cubers.length === 0) {
        return (
          <div className="mensaje-estado">
            No se encontraron competidores para este país dentro del rango analizado.
          </div>
        );
      }

      return (
        <>
          {estadisticas && (
            <PanelEstadisticas
              estadisticas={estadisticas}
              totalMostrados={cubers.length}
              etiquetaPais={etiquetaPais}
              nombreEvento={nombreEvento}
              tipoModalidad={tipoModalidad}
              fallidosRed={fallidosRed}
              fallidosInexistentes={fallidosInexistentes}
            />
          )}
          <div className="cuber-grid">
            {cubers.map((cuber, idx) => (
              <TarjetaCuber key={cuber.id} cuber={cuber} index={idx} />
            ))}
          </div>
        </>
      );
    }
  }
}