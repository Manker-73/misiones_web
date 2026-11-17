import { z } from "zod";


export const EVENTOS = {
  "222": "2x2x2",
  "333": "3x3x3",
  "444": "4x4x4",
  "555": "5x5x5",
  "333oh": "3x3x3 a una mano",
  "333bf": "3x3x3 a ciegas",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  minx: "Megaminx",
};

const CODIGOS_EVENTO = Object.keys(EVENTOS);
const EVENTOS_A_CIEGAS = ["333bf"];
const MAX_EVENTOS = 5;
export const EDAD_MIN = 6;
export const EDAD_MAX = 100;

// Formato oficial del WCA ID: año de la 1ª competición + 4 letras + 2 dígitos (2019GARC01)
const REGEX_WCA_ID = /^(19|20)\d{2}[A-Z]{4}\d{2}$/;

export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function calcularEdad(nacimiento, hoy = new Date()) {
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumplido =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
  if (aunNoCumplido) edad--;
  return edad;
}

// Fecha de nacimiento en tres campos (día / mes / año).
// Cada error se asigna al subcampo responsable, así RHF pone el foco justo ahí.
// Si todo es correcto, se transforma en una fecha ISO "YYYY-MM-DD" para enviar al API.
const esquemaNacimiento = z
  .object({
    dia: z.string().trim(),
    mes: z.string(),
    anio: z.string().trim(),
  })
  .superRefine(({ dia, mes, anio }, ctx) => {
    const error = (campo, message) => ctx.addIssue({ code: "custom", path: [campo], message });

    if (!dia && !mes && !anio) return error("dia", "Introduce tu fecha de nacimiento");
    if (!dia) return error("dia", "Falta el día");
    if (!mes) return error("mes", "Falta el mes");
    if (!anio) return error("anio", "Falta el año");
    if (!/^\d{1,2}$/.test(dia) || +dia < 1 || +dia > 31)
      return error("dia", "El día debe ser un número entre 1 y 31");
    if (!/^\d{4}$/.test(anio)) return error("anio", "El año debe tener 4 cifras (ej.: 2007)");

    // new Date "corrige" fechas imposibles (31 de febrero → 3 de marzo): lo detectamos
    // (setFullYear porque new Date(50, …) interpretaría el año 50 como 1950)
    const fecha = new Date(2000, +mes - 1, +dia);
    fecha.setFullYear(+anio);
    if (fecha.getDate() !== +dia) {
      return error("dia", `Esa fecha no existe: ${MESES[+mes - 1]} no tiene ${dia} días`);
    }
    if (fecha > new Date()) return error("anio", "La fecha no puede estar en el futuro");

    const edad = calcularEdad(fecha);
    if (edad < EDAD_MIN) return error("anio", `La edad mínima para competir es ${EDAD_MIN} años`);
    if (edad > EDAD_MAX)
      return error("anio", `Revisa el año: la edad máxima admitida es ${EDAD_MAX} años`);
  })
  .transform(({ dia, mes, anio }) => `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`);

// Los <input> vacíos llegan como "": los convertimos en undefined para que .optional() funcione
const vacioAUndefined = (v) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const esquemaInscripcion = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, { error: "El nombre es demasiado corto" })
      .max(60, { error: "Máximo 60 caracteres" }),

    email: z.email({ error: "Introduce un email válido (nombre@ejemplo.com)" }),

    nacimiento: esquemaNacimiento,

    primeraCompeticion: z.boolean(),

    wcaId: z.preprocess(
      vacioAUndefined,
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(REGEX_WCA_ID, { error: "Formato de WCA ID no válido (ej.: 2019GARC01)" })
        .optional()
    ),

    eventos: z
      .array(z.enum(CODIGOS_EVENTO))
      .min(1, { error: "Elige al menos una modalidad" })
      .max(MAX_EVENTOS, { error: `Puedes inscribirte en ${MAX_EVENTOS} modalidades como máximo` }),

    // Media de 3x3x3 en segundos (opcional): sirve para organizar los grupos
    media333: z.preprocess(
      vacioAUndefined,
      z.coerce
        .number({ error: "Introduce un número" })
        .positive({ error: "La media debe ser mayor que 0" })
        .max(600, { error: "Máximo 600 segundos (10 minutos)" })
        .optional()
    ),

    // z.boolean().refine en vez de z.literal(true): un literal que falla corta la
    // validación y se saltaría los .refine cruzados de abajo (ver temario, sección 3).
    aceptaNormas: z.boolean().refine((v) => v === true, {
      error: "Debes aceptar el reglamento de la WCA",
    }),
  })
  // Reglas que cruzan varios campos
  .refine((d) => d.primeraCompeticion || d.wcaId, {
    error: "Si ya has competido antes, indica tu WCA ID",
    path: ["wcaId"],
  })
  .refine((d) => !(d.primeraCompeticion && d.wcaId), {
    error: "Si es tu primera competición aún no tienes WCA ID: déjalo vacío",
    path: ["wcaId"],
  })
  .refine(
    (d) => !(d.primeraCompeticion && d.eventos.some((e) => EVENTOS_A_CIEGAS.includes(e))),
    {
      error: "Las modalidades a ciegas requieren haber competido antes",
      path: ["eventos"],
    }
  )
  .refine((d) => d.media333 === undefined || d.eventos.includes("333"), {
    error: "Solo indica la media de 3x3x3 si te inscribes en 3x3x3",
    path: ["media333"],
  });

export const valoresIniciales = {
  nombre: "",
  email: "",
  nacimiento: { dia: "", mes: "", anio: "" },
  primeraCompeticion: false,
  wcaId: "",
  eventos: [],
  media333: "",
  aceptaNormas: false,
};
