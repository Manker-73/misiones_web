import { useRef, useState } from 'react';
import {
  ConsultaCanceladaError,
  fetchDetallesEnLotes,
  fetchRanking
} from './api';
import { PanelEstadisticas } from './components/PanelEstadisticas';
import { TarjetaCuber } from './components/TarjetaCuber';
import {
  obtenerOpcionesEventos,
  obtenerOpcionesPaises,
  validarEventoWCA
} from './paises';
import {
  acotarLimite,
  procesarRankingCompleto
} from './transformers';
import {
  LIMITE_DEFECTO_RANKING,
  LIMITE_MAXIMO_RANKING,
  LIMITE_MINIMO_RANKING,
  TAMANO_LOTE_PETICIONES,
  type CodigoEventoWCA,
  type OpcionPais,
  type ResultadoProcesamiento,
  type TipoRanking
} from './types';

type EstadoVista =
  | { tipo: 'inicial' }
  | { tipo: 'cargando'; completados: number; total: number }
  | { tipo: 'cancelado' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'exito'; resultado: ResultadoProcesamiento };

const EVENTOS_DISPONIBLES = obtenerOpcionesEventos();

export function App() {
  // Estados de los filtros
  const [evento, setEvento] = useState<CodigoEventoWCA>('333');
  const [tipo, setTipo] = useState<TipoRanking>('single');
  const [pais, setPais] = useState<string>('All');
  const [inputTop, setInputTop] = useState<string>(String(LIMITE_DEFECTO_RANKING));
  const [opcionesPaises, setOpcionesPaises] = useState<OpcionPais[]>(() =>
    obtenerOpcionesPaises()
  );

  // Estado de la interfaz principal
  const [vista, setVista] = useState<EstadoVista>({ tipo: 'inicial' });

  // Referencia para el AbortController activo
  const controladorRef = useRef<AbortController | null>(null);
  const estaCargando = vista.tipo === 'cargando';

  const abortarConsultaActiva = (): void => {
    if (controladorRef.current) {
      controladorRef.current.abort();
      controladorRef.current = null;
    }
  };

  const ejecutarAnalisis = async (
    eventoParam: CodigoEventoWCA = evento,
    tipoParam: TipoRanking = tipo,
    paisParam: string = pais,
    topParam: string = inputTop
  ): Promise<void> => {
    abortarConsultaActiva();

    const controller = new AbortController();
    controladorRef.current = controller;
    const { signal } = controller;

    try {
      const limiteValidado = acotarLimite(
        topParam,
        LIMITE_MINIMO_RANKING,
        LIMITE_MAXIMO_RANKING
      );
      const topNormalizado = String(limiteValidado);
      setInputTop(topNormalizado);

      const eventoValidado = validarEventoWCA(eventoParam);

      setVista({ tipo: 'cargando', completados: 0, total: 0 });

      const rankingCrudo = await fetchRanking(eventoValidado, tipoParam, signal);

      const cantidadNecesaria =
        paisParam === 'All' ? limiteValidado : LIMITE_MAXIMO_RANKING;
      const muestraRanking = rankingCrudo.items.slice(0, cantidadNecesaria);

      const resultadoLotes = await fetchDetallesEnLotes(
        muestraRanking,
        TAMANO_LOTE_PETICIONES,
        (completados, total) => {
          if (!signal.aborted) {
            setVista({ tipo: 'cargando', completados, total });
          }
        },
        signal
      );

      if (signal.aborted) {
        throw new ConsultaCanceladaError();
      }

      const resultado = procesarRankingCompleto(
        muestraRanking,
        resultadoLotes,
        paisParam,
        topNormalizado,
        eventoValidado,
        tipoParam
      );

      setOpcionesPaises(resultado.opcionesPaisesActualizadas);
      if (
        paisParam !== 'All' &&
        !resultado.opcionesPaisesActualizadas.some((op) => op.codigo === paisParam)
      ) {
        setPais('All');
      }

      setVista({ tipo: 'exito', resultado });
    } catch (error) {
      // Si la consulta fue reemplazada por una nueva, ignoramos su cierre visual
      if (controladorRef.current !== null && controladorRef.current !== controller) {
        return;
      }
      if (error instanceof ConsultaCanceladaError || signal.aborted) {
        setVista({ tipo: 'cancelado' });
        return;
      }
      console.error('Fallo en la orquestación:', error);
      const mensaje =
        error instanceof Error
          ? error.message
          : 'Error inesperado al procesar los datos de la WCA.';
      setVista({ tipo: 'error', mensaje });
    } finally {
      if (controladorRef.current === controller) {
        controladorRef.current = null;
      }
    }
  };

  const manejarCancelar = (): void => {
    abortarConsultaActiva();
    setVista({ tipo: 'cancelado' });
  };

  // Replica el comportamiento de mision2: si cambia un select mientras hay una
  // petición en curso, aborta y lanza inmediatamente el nuevo análisis.
  const manejarCambioEvento = (nuevoValor: string): void => {
    const validado = validarEventoWCA(nuevoValor);
    setEvento(validado);
    if (controladorRef.current) {
      void ejecutarAnalisis(validado, tipo, pais, inputTop);
    }
  };

  const manejarCambioTipo = (nuevoValor: string): void => {
    const nuevoTipo: TipoRanking = nuevoValor === 'average' ? 'average' : 'single';
    setTipo(nuevoTipo);
    if (controladorRef.current) {
      void ejecutarAnalisis(evento, nuevoTipo, pais, inputTop);
    }
  };

  const manejarCambioPais = (nuevoPais: string): void => {
    setPais(nuevoPais);
    if (controladorRef.current) {
      void ejecutarAnalisis(evento, tipo, nuevoPais, inputTop);
    }
  };

  return (
    <>
      <header>
        <h1>WCA Speedcubing Analyzer</h1>
        <p className="header-subtitle">
          Explorador oficial multi-categoría de récords mundiales, comparativa de modalidades y métricas por país
        </p>
      </header>

      <section className="controles-panel">
        <div className="control-group">
          <label htmlFor="select-evento">
            <strong>Categoría:</strong>
          </label>
          <select
            id="select-evento"
            value={evento}
            onChange={(e) => manejarCambioEvento(e.target.value)}
          >
            {EVENTOS_DISPONIBLES.map(({ codigo, nombre }) => (
              <option key={codigo} value={codigo}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="select-tipo">
            <strong>Modalidad:</strong>
          </label>
          <select
            id="select-tipo"
            value={tipo}
            onChange={(e) => manejarCambioTipo(e.target.value)}
          >
            <option value="single">Single (Mejor resolución) ⚡</option>
            <option value="average">Average (Media oficial) 📊</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="select-pais">
            <strong>Filtrar por País:</strong>
          </label>
          <select
            id="select-pais"
            value={pais}
            onChange={(e) => manejarCambioPais(e.target.value)}
          >
            <option value="All">Todo el mundo 🌍</option>
            {opcionesPaises.map(({ codigo, nombre }) => (
              <option key={codigo} value={codigo}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="input-top">
            <strong>Mostrar Top:</strong>
          </label>
          <input
            type="number"
            id="input-top"
            value={inputTop}
            min={LIMITE_MINIMO_RANKING}
            max={LIMITE_MAXIMO_RANKING}
            className="input-top-number"
            onChange={(e) => setInputTop(e.target.value)}
          />
        </div>

        <div className="acciones-group">
          <button
            id="btn-cargar"
            type="button"
            disabled={estaCargando}
            className={estaCargando ? 'btn-deshabilitado' : ''}
            onClick={() => void ejecutarAnalisis()}
          >
            {estaCargando ? '⏳ Analizando...' : 'Analizar Récords'}
          </button>

          {estaCargando && (
            <button
              id="btn-cancelar"
              type="button"
              className="btn-cancelar"
              onClick={manejarCancelar}
            >
              ⏹️ Cancelar
            </button>
          )}
        </div>
      </section>

      <main id="app">
        {vista.tipo === 'inicial' && (
          <div className="mensaje-estado">
            <p>
              Selecciona la categoría, la modalidad y el país, y haz clic en{' '}
              <strong>Analizar Récords</strong>.
            </p>
          </div>
        )}

        {vista.tipo === 'cargando' && (
          <div className="mensaje-estado">
            <h2>⏳ Analizando base de datos de la WCA...</h2>
            <p className="progreso-texto">
              {vista.total > 0
                ? `Resolviendo identidades en lotes seguros: ${vista.completados} de ${vista.total} perfiles procesados.`
                : 'Conectando con el repositorio de rankings mundiales...'}
            </p>
            {vista.total > 0 && (
              <progress
                className="loader-progress"
                max={vista.total}
                value={vista.completados}
              />
            )}
          </div>
        )}

        {vista.tipo === 'cancelado' && (
          <div className="mensaje-estado">
            <h3>⏹️ Consulta cancelada</h3>
            <p>
              Se abortaron las peticiones en curso. Ajusta los filtros y pulsa Analizar Récords.
            </p>
          </div>
        )}

        {vista.tipo === 'error' && (
          <div className="mensaje-error">
            <h3>❌ Ha ocurrido un problema</h3>
            <p>{vista.mensaje}</p>
          </div>
        )}

        {vista.tipo === 'exito' && (
          <>
            {vista.resultado.cubers.length === 0 ? (
              <div className="mensaje-estado">
                No se encontraron competidores para este país dentro del rango analizado.
              </div>
            ) : (
              <>
                <PanelEstadisticas resultado={vista.resultado} />
                <div className="cuber-grid">
                  {vista.resultado.cubers.map((cuber, idx) => (
                    <TarjetaCuber key={cuber.id} cuber={cuber} index={idx} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default App;