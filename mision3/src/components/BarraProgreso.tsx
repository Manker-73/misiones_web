interface Props {
  completados: number;
  total: number;
}

export function BarraProgreso({ completados, total }: Props) {
  return (
    <div className="mensaje-estado">
      <h2>⏳ Analizando base de datos de la WCA...</h2>
      <p className="progreso-texto">
        {total > 0
          ? `Resolviendo identidades en lotes seguros: ${completados} de ${total} perfiles procesados.`
          : 'Conectando con el repositorio de rankings mundiales...'}
      </p>
      {total > 0 && (
        <progress
          className="loader-progress"
          max={total}
          value={completados}
        />
      )}
    </div>
  );
}