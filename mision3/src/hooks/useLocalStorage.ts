import { useCallback, useEffect, useState } from 'react';
import { eliminarDeCache, guardarEnCache, leerDeCache, TTL_RANKING_MS } from '../cache';

export function useLocalStorage<T>(
    clave: string,
    valorInicial: T,
    ttlMs: number = TTL_RANKING_MS
    ): [T, (nuevoValor: T | ((prev: T) => T)) => void, () => void] {
    const [valor, setValor] = useState<T>(() => {
    const guardado = leerDeCache<T>(clave, ttlMs);
    return guardado !== null ? guardado : valorInicial;
});

    const actualizarValor = useCallback(
    (nuevo: T | ((prev: T) => T)) => {
        setValor((prev) => {
        const valorResuelto =
            typeof nuevo === 'function' ? (nuevo as (prev: T) => T)(prev) : nuevo;
        guardarEnCache(clave, valorResuelto);
        return valorResuelto;
        });
    },
    [clave]
    );

    const limpiarValor = useCallback(() => {
    eliminarDeCache(clave);
    setValor(valorInicial);
    }, [clave, valorInicial]);

    useEffect(() => {
    const manejarCambiosExternos = (event: StorageEvent): void => {
        if (event.key === clave) {
        const actualizado = leerDeCache<T>(clave, ttlMs);
        setValor(actualizado !== null ? actualizado : valorInicial);
        }
    };

    window.addEventListener('storage', manejarCambiosExternos);
    return () => window.removeEventListener('storage', manejarCambiosExternos);
    }, [clave, ttlMs, valorInicial]);

    return [valor, actualizarValor, limpiarValor];
}