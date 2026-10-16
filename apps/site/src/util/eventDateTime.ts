interface EventDateTimeOptions {
  date: Date;
  endDate?: Date;
}

export function getEventEndDateTime({
  date,
  endDate,
}: EventDateTimeOptions): Date {
  return new Date((endDate ?? date).getTime() + 86400000);
}

export function isPastEvent(
  options: EventDateTimeOptions,
  now: Date = new Date(),
): boolean {
  return getEventEndDateTime(options) < now;
}
