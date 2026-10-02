const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatDate(value, fallback = "Not set") {
  if (!value) return fallback;

  const text = String(value);
  const dateOnly = DATE_ONLY_PATTERN.exec(text);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      )
    : new Date(text);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value, fallback = "Unknown time") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}