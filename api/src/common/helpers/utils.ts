export interface NormalizedDateRange {
  from?: Date;
  to?: Date;
}

export const normalizeDateRange = (
  from?: string,
  to?: string,
): NormalizedDateRange => {
  let normalizedFrom: Date | undefined;
  let normalizedTo: Date | undefined;

  if (from) {
    const date = new Date(from);
    if (!isNaN(date.getTime())) {
      normalizedFrom = new Date(date);
      normalizedFrom.setHours(0, 0, 0, 0);
    }
  }

  if (to) {
    const date = new Date(to);
    if (!isNaN(date.getTime())) {
      normalizedTo = new Date(date);
      normalizedTo.setHours(23, 59, 59, 999);
    }
  }

  return {
    from: normalizedFrom,
    to: normalizedTo,
  };
};
