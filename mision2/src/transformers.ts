export interface Cuber {
    id: string;
    nombre: string;
    pais: string;
    tiempoS: string;
    tiempoMs: number;
}

export interface RankingItem {
    personId: string;
    best: number;
}

export const construirCuber = (item: RankingItem, detalles: any): Cuber => ({
    id: item.personId,
    nombre: detalles?.name || "Identidad desconocida", 
    pais: detalles?.country || "Desconocido",
    tiempoS: (item.best / 100).toFixed(2) + "s",
    tiempoMs: item.best
});

export const filtrarPorPais = (cubers: Cuber[], pais: string): Cuber[] => {
    if (pais === 'All') return cubers;
    return cubers.filter(cuber => cuber.pais === pais);
};

export const calcularMediaTop = (cubers: Cuber[]): string | null => {
    if (cubers.length === 0) return null;
    const sumaTotal = cubers.reduce((acc, cuber) => acc + cuber.tiempoMs, 0);
    return (sumaTotal / cubers.length / 100).toFixed(2);
};