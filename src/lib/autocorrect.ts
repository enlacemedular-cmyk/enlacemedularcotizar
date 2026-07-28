/** Autocorrector ligero de ortografía y redacción para textos en español. */

const REEMPLAZOS: Record<string, string> = {
  // acentos y errores frecuentes
  demolicion: "demolición",
  instalacion: "instalación",
  instalaciones: "instalaciones",
  construccion: "construcción",
  remodelacion: "remodelación",
  adecuacion: "adecuación",
  iluminacion: "iluminación",
  ventilacion: "ventilación",
  cimentacion: "cimentación",
  impermeabilizacion: "impermeabilización",
  pintua: "pintura",
  pinturs: "pintura",
  electrico: "eléctrico",
  electrica: "eléctrica",
  electricos: "eléctricos",
  electricas: "eléctricas",
  hidraulico: "hidráulico",
  hidraulica: "hidráulica",
  hidraulicos: "hidráulicos",
  hidraulicas: "hidráulicas",
  metalico: "metálico",
  metalica: "metálica",
  ceramica: "cerámica",
  ceramico: "cerámico",
  marmol: "mármol",
  mesón: "mesón",
  meson: "mesón",
  bano: "baño",
  banos: "baños",
  disenio: "diseño",
  diseno: "diseño",
  disenos: "diseños",
  tabiqueria: "tabiquería",
  carpinteria: "carpintería",
  albanileria: "albañilería",
  albañileria: "albañilería",
  mamposteria: "mampostería",
  herreria: "herrería",
  plomeria: "plomería",
  jardineria: "jardinería",
  limpiesa: "limpieza",
  suministo: "suministro",
  sumistro: "suministro",
  acabdos: "acabados",
  mantenimeinto: "mantenimiento",
  aprobacion: "aprobación",
  supervision: "supervisión",
  direccion: "dirección",
  gestion: "gestión",
  ejecucion: "ejecución",
  reparacion: "reparación",
  fabricacion: "fabricación",
  aplicacion: "aplicación",
  demolicon: "demolición",
  anticipo: "anticipo",
  entrga: "entrega",
  entrege: "entrega",
  m2: "m²",
  m3: "m³",
  ud: "unidad",
  und: "unidad",
  porcentage: "porcentaje",
  presupuesto: "presupuesto",
  cocina: "cocina",
  habitacion: "habitación",
  area: "área",
  areas: "áreas",
  segun: "según",
  tambien: "también",
  ademas: "además",
  mas: "más",
  incluccion: "inclusión",
  inclucion: "inclusión",
};

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Corrige espacios, puntuación, mayúsculas y palabras mal escritas frecuentes. */
export function autocorregir(texto: string): string {
  if (!texto) return texto;

  let out = texto
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:])(?=[^\s\d])/g, "$1 ")
    .trim();

  out = out
    .split(" ")
    .map((palabra) => {
      const m = palabra.match(/^([¡¿("']*)([\p{L}\p{N}²³]+)([)"'.,;:!?]*)$/u);
      if (!m) return palabra;
      const [, pre, core, post] = m;
      const lower = core.toLocaleLowerCase("es");
      const fix = REEMPLAZOS[lower];
      if (!fix) return palabra;
      const corregido =
        core === core.toLocaleUpperCase("es") && core.length > 1
          ? fix.toLocaleUpperCase("es")
          : core[0] === core[0].toLocaleUpperCase("es")
            ? capitalizar(fix)
            : fix;
      return `${pre}${corregido}${post}`;
    })
    .join(" ");

  // Mayúscula inicial y después de punto
  out = out.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_m, p1: string, p2: string) => p1 + p2.toLocaleUpperCase("es"));

  return out;
}
