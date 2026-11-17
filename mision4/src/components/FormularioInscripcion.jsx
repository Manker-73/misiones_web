import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  esquemaInscripcion,
  valoresIniciales,
  EVENTOS,
  MESES,
} from "../schemas/inscripcion";
import MensajeError from "./MensajeError";

// Si cambia una parte de la fecha, hay que revalidar también las otras dos
// (p. ej. el error "febrero no tiene 31 días" está en el día, pero se arregla cambiando el mes)
const PARTES_FECHA = ["nacimiento.dia", "nacimiento.mes", "nacimiento.anio"];
const depsFecha = (parte) => PARTES_FECHA.filter((p) => p !== parte);

// Une los ids de los textos que describen un campo (pista y/o error) para aria-describedby
const describir = (...ids) => ids.filter(Boolean).join(" ") || undefined;

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
    shouldFocusError: true, // al enviar con errores, el foco va al primer campo inválido
  });

  // Campos que se muestran u ocultan según otros campos
  const primeraCompeticion = watch("primeraCompeticion");
  const eventos = watch("eventos");
  const compite333 = eventos?.includes("333");

  // Props de accesibilidad de un campo: lo marca como inválido y lo enlaza con su error
  function aria(nombre, error, idPista) {
    const idError = `error-${nombre}`;
    return {
      "aria-invalid": error ? "true" : "false",
      "aria-describedby": describir(idPista, error && idError),
    };
  }

  const errorNac = errors.nacimiento ?? {};

  async function onSubmit(datos) {
    // Simulamos la petición; en el paso 6 la cambiaremos por useMutation
    setUltimaInscripcion(null);
    await new Promise((r) => setTimeout(r, 800));
    setUltimaInscripcion(datos);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="formulario">
      <h2>Inscripción</h2>
      <p className="pista">Todos los campos son obligatorios salvo los marcados como opcionales.</p>

      {/* ---------- Nombre ---------- */}
      <div className="campo">
        <label htmlFor="nombre">Nombre completo</label>
        <input
          id="nombre"
          autoComplete="name"
          {...aria("nombre", errors.nombre)}
          {...register("nombre")}
        />
        <MensajeError id="error-nombre">{errors.nombre?.message}</MensajeError>
      </div>

      {/* ---------- Email ---------- */}
      <div className="campo">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@ejemplo.com"
          {...aria("email", errors.email)}
          {...register("email")}
        />
        <MensajeError id="error-email">{errors.email?.message}</MensajeError>
      </div>

      {/* ---------- Fecha de nacimiento (3 campos) ---------- */}
      <fieldset className="campo grupo-fecha">
        <legend className="etiqueta">Fecha de nacimiento</legend>
        <p id="pista-nacimiento" className="pista">
          Por ejemplo: 27 marzo 2007
        </p>

        <div className="fecha">
          <div className="parte-fecha">
            <label htmlFor="nacimiento-dia">Día</label>
            <input
              id="nacimiento-dia"
              inputMode="numeric"
              maxLength={2}
              autoComplete="bday-day"
              className="dia"
              {...aria("nacimiento-dia", errorNac.dia, "pista-nacimiento")}
              {...register("nacimiento.dia", { deps: depsFecha("nacimiento.dia") })}
            />
          </div>

          <div className="parte-fecha">
            <label htmlFor="nacimiento-mes">Mes</label>
            <select
              id="nacimiento-mes"
              autoComplete="bday-month"
              {...aria("nacimiento-mes", errorNac.mes, "pista-nacimiento")}
              {...register("nacimiento.mes", { deps: depsFecha("nacimiento.mes") })}
            >
              <option value=""> </option>
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
              {...aria("nacimiento-anio", errorNac.anio, "pista-nacimiento")}
              {...register("nacimiento.anio", { deps: depsFecha("nacimiento.anio") })}
            />
          </div>
        </div>

        {/* Puede haber dos errores a la vez (día inexistente + año fuera de rango) */}
        <MensajeError id="error-nacimiento-dia">{errorNac.dia?.message}</MensajeError>
        <MensajeError id="error-nacimiento-mes">{errorNac.mes?.message}</MensajeError>
        <MensajeError id="error-nacimiento-anio">{errorNac.anio?.message}</MensajeError>
      </fieldset>

      {/* ---------- Experiencia ---------- */}
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
          <p id="pista-wcaId" className="pista">
            Año de tu primera competición + 4 letras + 2 cifras. Lo encontrarás en tu perfil de la WCA.
          </p>
          <input
            id="wcaId"
            autoComplete="off"
            spellCheck={false}
            placeholder="2019GARC01"
            {...aria("wcaId", errors.wcaId, "pista-wcaId")}
            {...register("wcaId")}
          />
          <MensajeError id="error-wcaId">{errors.wcaId?.message}</MensajeError>
        </div>
      )}

      {/* ---------- Modalidades (grupo de checkboxes) ---------- */}
      <fieldset
        className="campo grupo-opciones"
        aria-describedby={describir("pista-eventos", errors.eventos && "error-eventos")}
      >
        <legend className="etiqueta">Modalidades</legend>
        <p id="pista-eventos" className="pista">
          Elige entre 1 y 5.
        </p>
        <div className="opciones">
          {Object.entries(EVENTOS).map(([codigo, nombre]) => (
            <label key={codigo} className="opcion">
              <input
                type="checkbox"
                value={codigo}
                aria-invalid={errors.eventos ? "true" : "false"}
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
        <MensajeError id="error-eventos">{errors.eventos?.message}</MensajeError>
      </fieldset>

      {compite333 && (
        <div className="campo">
          <label htmlFor="media333">Tu media de 3x3x3 en segundos (opcional)</label>
          <p id="pista-media333" className="pista">
            Nos ayuda a organizar los grupos. Ej.: 14.52
          </p>
          <input
            id="media333"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            {...aria("media333", errors.media333, "pista-media333")}
            {...register("media333")}
          />
          <MensajeError id="error-media333">{errors.media333?.message}</MensajeError>
        </div>
      )}

      {/* ---------- Normas ---------- */}
      <div className="campo">
        <div className="campo-check">
          <input
            id="aceptaNormas"
            type="checkbox"
            {...aria("aceptaNormas", errors.aceptaNormas)}
            {...register("aceptaNormas")}
          />
          <label htmlFor="aceptaNormas">Acepto el reglamento de la WCA</label>
        </div>
        <MensajeError id="error-aceptaNormas">{errors.aceptaNormas?.message}</MensajeError>
      </div>

      {/* Solo se deshabilita mientras se envía: nunca "hasta que sea válido" */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Inscribirme"}
      </button>

      {/* Región viva siempre presente: role="status" anuncia el éxito sin interrumpir */}
      <div role="status" className="estado">
        {ultimaInscripcion && (
          <p className="ok">¡Inscripción enviada, {ultimaInscripcion.nombre}!</p>
        )}
      </div>
    </form>
  );
}

export default FormularioInscripcion;
