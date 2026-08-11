/**
 * Locale comun usado para fechas y horas en la UI.
 */
export const locale = 'es-ES';

/**
 * Formatea un mes y ano largos para encabezados del calendario.
 *
 * @param date Fecha a formatear.
 * @returns Texto con mes y ano localizados.
 */
export const formatMonthYear = (date: Date) =>
  new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);

/**
 * Formatea el nombre corto del dia de la semana.
 *
 * @param date Fecha a formatear.
 * @returns Nombre corto del dia localizado.
 */
export const formatShortWeekday = (date: Date) =>
  new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);

/**
 * Formatea una fecha completa para cabeceras y detalles.
 *
 * @param date Fecha a formatear.
 * @returns Fecha larga localizada.
 */
export const formatLongDate = (date: Date) =>
  new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

/**
 * Formatea un dia y mes abreviado para tarjetas y vistas compactas.
 *
 * @param date Fecha a formatear.
 * @returns Dia y mes abreviado.
 */
export const formatDayMonth = (date: Date) =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date);

/**
 * Formatea una marca de tiempo del dominio para presentarla en la UI.
 *
 * @param value Fecha serializada opcional.
 * @returns Hora localizada o texto fallback si no existe valor.
 */
export const formatTime = (value?: string) => {
  if (!value) {
    return 'Sin hora';
  }

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

/**
 * Convierte la primera letra de un texto en mayuscula.
 *
 * @param value Texto de entrada.
 * @returns Texto capitalizado.
 */
export const capitalize = (value: string) =>
  value.length ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

/**
 * Convierte un color hexadecimal a `rgba(...)`.
 *
 * @param hex Color hexadecimal de tres o seis caracteres.
 * @param alpha Opacidad final.
 * @returns Cadena CSS en formato RGBA.
 */
export const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const safe = normalized.length === 3
    ? normalized
        .split('')
        .map((chunk) => `${chunk}${chunk}`)
        .join('')
    : normalized;
  const int = Number.parseInt(safe, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Elige un color de texto con buen contraste sobre un fondo hexadecimal.
 *
 * @param hex Color de fondo en formato hexadecimal.
 * @returns Blanco o slate oscuro segun la luminancia del fondo.
 */
export const getContrastTextColor = (hex: string) => {
  const normalized = hex.replace('#', '');
  const safe = normalized.length === 3
    ? normalized
        .split('')
        .map((chunk) => `${chunk}${chunk}`)
        .join('')
    : normalized;
  const int = Number.parseInt(safe, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.62 ? '#0f172a' : '#ffffff';
};

/**
 * Obtiene las iniciales principales de un nombre compuesto.
 *
 * @param name Nombre completo.
 * @returns Hasta dos iniciales en mayuscula.
 */
export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
