export const DEFAULT_TIMEZONE = "America/Monterrey";

export function isValidTimezone(timezone: string) {
  try { new Intl.DateTimeFormat("es-MX", { timeZone: timezone }).format(); return true; }
  catch { return false; }
}

export function dateTimeInput(value: Date | string | null | undefined, timezone = DEFAULT_TIMEZONE) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

// datetime-local no incluye zona: interpretamos la hora escrita en la zona del curso.
export function zonedDateTimeToIso(value: string, timezone: string) {
  if (!value) return "";
  if (!isValidTimezone(timezone)) throw new Error("La zona horaria no es válida.");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Revisa la fecha y el horario.");
  const wallTime = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(wallTime)) throw new Error("Revisa la fecha y el horario.");
  let instant = wallTime;
  for (let i = 0; i < 4; i++) {
    const displayed = Date.parse(`${dateTimeInput(new Date(instant), timezone)}:00Z`);
    const difference = wallTime - displayed;
    if (difference === 0 && dateTimeInput(new Date(instant), timezone) === value) return new Date(instant).toISOString();
    instant += difference;
  }
  throw new Error("Esta hora no existe en la zona horaria seleccionada. Elige otra hora.");
}
