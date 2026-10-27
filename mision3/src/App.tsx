// src/App.tsx
import { useState } from 'react';
import { FiltrosPanel } from './components/FiltrosPanel';
import { Header } from './components/Header';
import { VistaResultado } from './components/VistaResultado';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useWcaRanking, type ParametrosConsulta } from './hooks/useWcaRanking';
import { validarEventoWCA } from './paises';
import { acotarLimite } from './transformers';
import {
  LIMITE_DEFECTO_RANKING,
  LIMITE_MAXIMO_RANKING,
  LIMITE_MINIMO_RANKING,
  type CodigoEventoWCA,
  type TipoRanking
} from './types';

interface FiltrosGuardados {
  evento: CodigoEventoWCA;
  tipo: TipoRanking;
  pais: string;
  inputTop: string;
}

const FILTROS_INICIALES: FiltrosGuardados = {
  evento: '333',
  tipo: 'single',
  pais: 'All',
  inputTop: String(LIMITE_DEFECTO_RANKING)
};

export function App() {
  const [filtros, setFiltros] = useLocalStorage<FiltrosGuardados>(
    'wca_filtros_preferencias',
    FILTROS_INICIALES
  );
  const [consultaActiva, setConsultaActiva] = useState<ParametrosConsulta | null>(null);

  const { vista, estaCargando, opcionesPaises, cancelarAnalisis } =
    useWcaRanking(consultaActiva);

  // Estado derivado puro: asegura que el país seleccionado exista en las opciones disponibles
  const paisSeleccionadoValido =
    filtros.pais === 'All' || opcionesPaises.some((op) => op.codigo === filtros.pais)
      ? filtros.pais
      : 'All';

  const limiteDerivado = acotarLimite(
    filtros.inputTop,
    LIMITE_MINIMO_RANKING,
    LIMITE_MAXIMO_RANKING
  );

  const dispararConsulta = (nuevosFiltros: FiltrosGuardados): void => {
    const limiteSeguro = acotarLimite(
      nuevosFiltros.inputTop,
      LIMITE_MINIMO_RANKING,
      LIMITE_MAXIMO_RANKING
    );
    setConsultaActiva((prev) => ({
      evento: nuevosFiltros.evento,
      tipo: nuevosFiltros.tipo,
      pais: nuevosFiltros.pais,
      limite: limiteSeguro,
      idEjecucion: (prev?.idEjecucion ?? 0) + 1
    }));
  };

  const manejarCambioEvento = (valor: string): void => {
    const actualizado = { ...filtros, evento: validarEventoWCA(valor) };
    setFiltros(actualizado);
    if (estaCargando) dispararConsulta(actualizado);
  };

  const manejarCambioTipo = (valor: string): void => {
    const nuevoTipo: TipoRanking = valor === 'average' ? 'average' : 'single';
    const actualizado = { ...filtros, tipo: nuevoTipo };
    setFiltros(actualizado);
    if (estaCargando) dispararConsulta(actualizado);
  };

  const manejarCambioPais = (nuevoPais: string): void => {
    const actualizado = { ...filtros, pais: nuevoPais };
    setFiltros(actualizado);
    if (estaCargando) dispararConsulta(actualizado);
  };

  const manejarAnalizar = (): void => {
    const normalizado = {
      ...filtros,
      pais: paisSeleccionadoValido,
      inputTop: String(limiteDerivado)
    };
    setFiltros(normalizado);
    dispararConsulta(normalizado);
  };

  return (
    <>
      <Header />

      <FiltrosPanel
        evento={filtros.evento}
        tipo={filtros.tipo}
        pais={paisSeleccionadoValido}
        inputTop={filtros.inputTop}
        opcionesPaises={opcionesPaises}
        estaCargando={estaCargando}
        onEventoChange={manejarCambioEvento}
        onTipoChange={manejarCambioTipo}
        onPaisChange={manejarCambioPais}
        onTopChange={(inputTop) => setFiltros({ ...filtros, inputTop })}
        onTopBlur={() =>
          setFiltros({ ...filtros, inputTop: String(limiteDerivado) })
        }
        onAnalizar={manejarAnalizar}
        onCancelar={cancelarAnalisis}
      />

      <main id="app">
        <VistaResultado vista={vista} />
      </main>
    </>
  );
}

export default App;