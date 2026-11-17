import { useInscripciones } from "../hooks/useInscripciones";
import { EVENTOS } from "../schemas/inscripcion";

const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

function ListaInscripciones() {
  const { data: inscripciones, isPending, isError, error, isFetching, refetch } =
    useInscripciones();

  return (
    <section className="lista" aria-labelledby="titulo-lista">
      <div className="lista-cabecera">
        <h2 id="titulo-lista">
          Participantes
          {inscripciones && <span className="contador"> ({inscripciones.length})</span>}
        </h2>
        {/* isFetching: hay datos en pantalla pero se están refrescando por detrás */}
        {isFetching && !isPending && (
          <span className="actualizando" role="status">
            Actualizando…
          </span>
        )}
      </div>

      {isPending && (
        <p role="status" className="cargando">
          Cargando participantes…
        </p>
      )}

      {isError && (
        <div role="alert" className="aviso-error">
          <p>{error.message}</p>
          <button type="button" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {inscripciones?.length === 0 && (
        <p className="vacio">Todavía no hay nadie inscrito. ¡Sé el primero!</p>
      )}

      {inscripciones?.length > 0 && (
        <ul className="tarjetas">
          {inscripciones.map((p) => (
            <li key={p.id} className="tarjeta">
              <div className="tarjeta-cabecera">
                <h3>{p.nombre}</h3>
                {p.primeraCompeticion ? (
                  <span className="insignia nuevo">Primera competición</span>
                ) : (
                  <span className="insignia">{p.wcaId}</span>
                )}
              </div>

              <ul className="eventos" aria-label="Modalidades">
                {p.eventos.map((codigo) => (
                  <li key={codigo}>{EVENTOS[codigo] ?? codigo}</li>
                ))}
              </ul>

              <p className="detalle">
                {p.media333 !== undefined && <>Media 3x3x3: {p.media333.toFixed(2)} s · </>}
                Inscrito el {formatoFecha.format(new Date(p.fechaInscripcion))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ListaInscripciones;
