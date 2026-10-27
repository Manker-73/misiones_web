
// src/hooks/useWcaRanking.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConsultaCanceladaError,
  fetchDetallesEnLotes,
  fetchRanking
} from '../api';
import { obtenerOpcionesPaises } from '../paises';
import { procesarRankingCompleto } from '../transformers';
import {
  LIMITE_MAXIMO_RANKING,
  TAMANO_LOTE_PETICIONES,
  type CodigoEventoWCA,
  type OpcionPais,
  type ResultadoProcesamiento,
  type TipoRanking
} from '../types';

export interface ParametrosConsulta {
  evento: CodigoEventoWCA;
  tipo: TipoRanking;
  pais: string;
  limite: number;
  idEjecucion: number;
}

export type EstadoVista =
  | { tipo: 'inicial' }
  | { tipo: 'cargando'; completados: number; total: number }
  | { tipo: 'cancelado' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'exito'; resultado: ResultadoProcesamiento };

const PAISES_BASE: OpcionPais[] = obtenerOpcionesPaises();

export function useWcaRanking(consulta: ParametrosConsulta | null) {
  const [vista, setVista] = useState<EstadoVista>({ tipo: 'inicial' });
  const controladorRef = useRef<AbortController | null>(null);

  const cancelarAnalisis = useCallback((): void => {
    if (controladorRef.current) {
      controladorRef.current.abort();
      controladorRef.current = null;
    }
    setVista({ tipo: 'cancelado' });
  }, []);

  useEffect(() => {
    if (!consulta) return;

    const controller = new AbortController();
    controladorRef.current = controller;
    const { signal } = controller;

    const ejecutar = async (): Promise<void> => {
      setVista({ tipo: 'cargando', completados: 0, total: 0 });

      try {
        const rankingCrudo = await fetchRanking(
          consulta.evento,
          consulta.tipo,
          signal
        );

        const cantidadNecesaria =
          consulta.pais === 'All' ? consulta.limite : LIMITE_MAXIMO_RANKING;
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
          consulta.pais,
          String(consulta.limite),
          consulta.evento,
          consulta.tipo
        );

        setVista({ tipo: 'exito', resultado });
      } catch (error) {
        if (signal.aborted || error instanceof ConsultaCanceladaError) {
          return;
        }
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

    void ejecutar();

    // Cleanup del efecto: aborta la petición si cambian las dependencias o se desmonta el componente
    return () => {
      controller.abort();
    };
  }, [consulta]);

  const estaCargando = vista.tipo === 'cargando';

  // Estado derivado puro: sin duplicar useState para opcionesPaises
  const opcionesPaises: OpcionPais[] =
    vista.tipo === 'exito'
      ? vista.resultado.opcionesPaisesActualizadas
      : PAISES_BASE;

  return {
    vista,
    estaCargando,
    opcionesPaises,
    cancelarAnalisis
  };
}