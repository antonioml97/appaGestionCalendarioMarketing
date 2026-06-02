/**
 * Tipo permitido para mutar valores de query params.
 */
type QueryValue = string | string[] | null | undefined;

/**
 * Construye una URL a partir de la ruta base y una serie de cambios en query params.
 *
 * @param pathname Ruta base.
 * @param currentParams Parametros actuales de la URL.
 * @param updates Cambios a aplicar sobre la query.
 * @returns URL final con los parametros actualizados.
 */
export const buildHref = (
  pathname: string,
  currentParams: URLSearchParams,
  updates: Record<string, QueryValue>,
) => {
  const next = new URLSearchParams(currentParams);

  for (const [key, value] of Object.entries(updates)) {
    next.delete(key);

    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((entry) => next.append(key, entry));
      continue;
    }

    if (value) {
      next.set(key, value);
    }
  }

  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
};

/**
 * Alterna un valor dentro de una query multi-select.
 *
 * @param pathname Ruta base.
 * @param currentParams Parametros actuales de la URL.
 * @param key Nombre del parametro multi-select.
 * @param value Valor que se quiere activar o desactivar.
 * @returns URL con el valor alternado.
 */
export const toggleQueryValue = (
  pathname: string,
  currentParams: URLSearchParams,
  key: string,
  value: string,
) => {
  const currentValues = currentParams.getAll(key);
  const nextValues = currentValues.includes(value)
    ? currentValues.filter((entry) => entry !== value)
    : [...currentValues, value];

  return buildHref(pathname, currentParams, { [key]: nextValues });
};
