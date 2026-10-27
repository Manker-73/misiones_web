import { obtenerOpcionesEventos } from '../paises';
import {
  LIMITE_MAXIMO_RANKING,
  LIMITE_MINIMO_RANKING,
  type CodigoEventoWCA,
  type OpcionPais,
  type TipoRanking
} from '../types';
import { CampoSelect, type OpcionSelect } from './CampoSelect';

interface Props {
  evento: CodigoEventoWCA;
  tipo: TipoRanking;
  pais: string;
  inputTop: string;
  opcionesPaises: OpcionPais[];
  estaCargando: boolean;
  onEventoChange: (evento: string) => void;
  onTipoChange: (tipo: string) => void;
  onPaisChange: (pais: string) => void;
  onTopChange: (top: string) => void;
  onTopBlur: () => void;
  onAnalizar: () => void;
  onCancelar: () => void;
}

const OPCIONES_EVENTOS: OpcionSelect[] = obtenerOpcionesEventos().map(
  ({ codigo, nombre }) => ({ valor: codigo, etiqueta: nombre })
);

const OPCIONES_MODALIDAD: OpcionSelect[] = [
  { valor: 'single', etiqueta: 'Single (Mejor resolución) ⚡' },
  { valor: 'average', etiqueta: 'Average (Media oficial) 📊' }
];

export function FiltrosPanel({
  evento,
  tipo,
  pais,
  inputTop,
  opcionesPaises,
  estaCargando,
  onEventoChange,
  onTipoChange,
  onPaisChange,
  onTopChange,
  onTopBlur,
  onAnalizar,
  onCancelar
}: Props) {
  const listaPaises: OpcionSelect[] = [
    { valor: 'All', etiqueta: 'Todo el mundo 🌍' },
    ...opcionesPaises.map(({ codigo, nombre }) => ({
      valor: codigo,
      etiqueta: nombre
    }))
  ];

  return (
    <section className="controles-panel">
      <CampoSelect
        id="select-evento"
        etiqueta="Categoría:"
        valor={evento}
        opciones={OPCIONES_EVENTOS}
        onChange={onEventoChange}
      />

      <CampoSelect
        id="select-tipo"
        etiqueta="Modalidad:"
        valor={tipo}
        opciones={OPCIONES_MODALIDAD}
        onChange={onTipoChange}
      />

      <CampoSelect
        id="select-pais"
        etiqueta="Filtrar por País:"
        valor={pais}
        opciones={listaPaises}
        onChange={onPaisChange}
      />

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
          onChange={(e) => onTopChange(e.target.value)}
          onBlur={onTopBlur}
        />
      </div>

      <div className="acciones-group">
        <button
          id="btn-cargar"
          type="button"
          disabled={estaCargando}
          className={estaCargando ? 'btn-deshabilitado' : ''}
          onClick={onAnalizar}
        >
          {estaCargando ? '⏳ Analizando...' : 'Analizar Récords'}
        </button>

        {estaCargando && (
          <button
            id="btn-cancelar"
            type="button"
            className="btn-cancelar"
            onClick={onCancelar}
          >
            ⏹️ Cancelar
          </button>
        )}
      </div>
    </section>
  );
}