export type TimestampLike = {
  seconds?: number
  nanoseconds?: number
  _seconds?: number
  _nanoseconds?: number
  toDate?: () => Date
}

export type DateLike = TimestampLike | Date | string | number | null | undefined

const getSecondsValue = (value: TimestampLike): number | undefined => {
  if (typeof value.seconds === "number") return value.seconds
  if (typeof value._seconds === "number") return value._seconds
  return undefined
}

/**
 * Normalizes Firestore timestamps, ISO strings, numbers, or Date objects into a valid Date.
 * Returns null when the input cannot be parsed instead of throwing at the callsite.
 */
export const parseDateInput = (value: DateLike): Date | null => {
  if (!value) return null

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      const parsed = value.toDate()
      return isNaN(parsed.getTime()) ? null : parsed
    }

    const seconds = getSecondsValue(value)
    if (typeof seconds === "number") {
      const parsed = new Date(seconds * 1000)
      return isNaN(parsed.getTime()) ? null : parsed
    }
  }

  return null
}

export const formatDateSafe = (
  value: DateLike,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-US",
  fallback = ""
): string => {
  const parsed = parseDateInput(value)
  if (!parsed) return fallback

  try {
    return parsed.toLocaleDateString(locale, options)
  } catch {
    return fallback
  }
}
