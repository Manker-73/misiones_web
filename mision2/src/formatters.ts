export const formatearTiempoWCA = (centesimas: number): string => {
    const totalSegundos = centesimas / 100;
    if (totalSegundos < 60) {
        return `${totalSegundos.toFixed(2)}s`;
    }
    const minutos = Math.floor(totalSegundos / 60);
    const segundosRestantes = (totalSegundos % 60).toFixed(2).padStart(5, '0');
    return `${minutos}:${segundosRestantes}`;
};

export const formatearPorcentaje = (parte: number, total: number): number => {
    if (total <= 0) return 0;
    return Math.round((parte / total) * 100);
};