import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  esquemaInscripcion,
  valoresIniciales,
  EVENTOS,
  MESES,
} from "../schemas/inscripcion";

// Si cambia una parte de la fecha, hay que revalidar también las otras dos
// (p. ej. el error "febrero no tiene 31 días" está en el día, pero se arregla cambiando el mes)
const PARTES_FECHA = ["nacimiento.dia", "nacimiento.mes", "nacimiento.anio"];
const depsFecha = (parte) => PARTES_FECHA.filter((p) => p !== parte);

function FormularioInscripcion() {
  const [ultimaInscripcion, setUltimaInscripcion] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(esquemaInscripcion),
    defaultValues: valoresIniciales,
  });

  // Campos que se muestran u ocultan según otros campos
  const primeraCompeticion = watch("primeraCompeticion");
  const eventos = watch("eventos");
  const compite333 = eventos?.includes("333");

  // Errores de la fecha, en el orden de los campos (puede haber más de uno: día + año)
  const erroresNacimiento = ["dia", "mes", "anio"]
    .map((parte) => errors.nacimiento?.[parte]?.message)
    .filter(Boolean);

  async function onSubmit(datos) {
    // Simulamos la petición; en el paso 6 la cambiaremos por useMutation
    await new Promise((r) => setTimeout(r, 800));
    setUltimaInscripcion(datos);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="formulario">
      <h2>Inscripción</h2>

      <div className="campo">
        <label htmlFor="nombre">Nombre completo</label>
        <input id="nombre" {...register("nombre")} />
        {errors.nombre && <p className="error">{errors.nombre.message}</p>}
      </div>

      <div className="campo">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" placeholder="nombre@ejemplo.com" {...register("email")} />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>

      <fieldset className="campo grupo-fecha">
        <legend className="etiqueta">Fecha de nacimiento</legend>
        <p className="pista">Por ejemplo: 27 marzo 2007</p>

        <div className="fecha">
          <div className="parte-fecha">
            <label htmlFor="nacimiento-dia">Día</label>
            <input
              id="nacimiento-dia"
              inputMode="numeric"
              maxLength={2}
              autoComplete="bday-day"
              className="dia"
              {...register("nacimiento.dia", { deps: depsFecha("nacimiento.dia") })}
            />
          </div>

          <div className="parte-fecha">
            <label htmlFor="nacimiento-mes">Mes</label>
            <select
              id="nacimiento-mes"
              autoComplete="bday-month"
              {...register("nacimiento.mes", { deps: depsFecha("nacimiento.mes") })}
            >
              <option value="">— Mes —</option>
              {MESES.map((mes, i) => (
                <option key={mes} value={i + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>

          <div className="parte-fecha">
            <label htmlFor="nacimiento-anio">Año</label>
            <input
              id="nacimiento-anio"
              inputMode="numeric"
              maxLength={4}
              autoComplete="bday-year"
              className="anio"
              {...register("nacimiento.anio", { deps: depsFecha("nacimiento.anio") })}
            />
          </div>
        </div>

        {erroresNacimiento.map((mensaje) => (
          <p key={mensaje} className="error">
            {mensaje}
          </p>
        ))}
      </fieldset>

      <div className="campo campo-check">
        <input
          id="primeraCompeticion"
          type="checkbox"
          {...register("primeraCompeticion", {
            // Si es su primera competición no tiene WCA ID: lo vaciamos
            onChange: (e) => e.target.checked && setValue("wcaId", ""),
            deps: ["wcaId", "eventos"], // revalida las reglas cruzadas que dependen de este campo
          })}
        />
        <label htmlFor="primeraCompeticion">Es mi primera competición WCA</label>
      </div>

      {!primeraCompeticion && (
        <div className="campo">
          <label htmlFor="wcaId">WCA ID</label>
          <input id="wcaId" placeholder="2019GARC01" {...register("wcaId")} />
          {errors.wcaId && <p className="error">{errors.wcaId.message}</p>}
        </div>
      )}

      <div className="campo">
        <p className="etiqueta">Modalidades (máx. 5)</p>
        <div className="opciones">
          {Object.entries(EVENTOS).map(([codigo, nombre]) => (
            <label key={codigo} className="opcion">
              <input
                type="checkbox"
                value={codigo}
                {...register("eventos", {
                  // Si deja de competir en 3x3x3, la media ya no aplica
                  onChange: () => {
                    if (!getValues("eventos").includes("333")) setValue("media333", "");
                  },
                  deps: ["media333"],
                })}
              />
              {nombre}
            </label>
          ))}
        </div>
        {errors.eventos && <p className="error">{errors.eventos.message}</p>}
      </div>

      {compite333 && (
        <div className="campo">
          <label htmlFor="media333">Tu media de 3x3x3 en segundos (opcional)</label>
          <input id="media333" type="number" step="0.01" inputMode="decimal" {...register("media333")} />
          {errors.media333 && <p className="error">{errors.media333.message}</p>}
        </div>
      )}

      <div className="campo campo-check">
        <input id="aceptaNormas" type="checkbox" {...register("aceptaNormas")} />
        <label htmlFor="aceptaNormas">Acepto el reglamento de la WCA</label>
      </div>
      {errors.aceptaNormas && <p className="error">{errors.aceptaNormas.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Inscribirme"}
      </button>

      {ultimaInscripcion && (
        <p className="ok">¡Inscripción enviada, {ultimaInscripcion.nombre}!</p>
      )}
    </form>
  );
}

export default FormularioInscripcion;
