type QueryValue = string | string[] | null | undefined;

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
