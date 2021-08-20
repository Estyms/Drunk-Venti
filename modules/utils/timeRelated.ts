interface timeInfo {
  remainingDays: number;
  remainingHours: number;
  remainingMinutes: number;
}

/**
 * Gets the current day from the Genshin Server standard
 */
function getGenshinDayName() {
  const d = new Date();
  d.setHours(d.getHours() - 4);
  switch (d.getDay()) {
    case 0:
      return "sunday";
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    case 6:
      return "saturday";
    default:
      return "";
  }
}

/**
 * Parses a time string to a Date Object
 * @param time String we want to convert to a date
 */
function parseTime(time: string): Date {
  return new Date(time);
}

/**
 * Gets the difference in Millisecond of two dates
 * @param date1 First date
 * @param date2 Second date
 */
function timeDifference(date1: Date, date2: Date): number {
  return Math.floor(Math.abs((date1.valueOf() - date2.valueOf())));
}

/**
 * Puts the remaining time to an event in a string format
 * @param remaining timeInfo object
 * @param upcomming [OPTIONAL (false)] tells if it's an upcomming event or not
 */
function stringifyRemainingTime(
  remaining: timeInfo,
  upcomming = false,
): string {
  if (remaining.remainingDays) {
    return upcomming
      ? `In ${remaining.remainingDays} day(s)`
      : `${remaining.remainingDays} day(s) remaining`;
  }
  if (remaining.remainingHours) {
    return upcomming
      ? `In ${remaining.remainingHours +
        (remaining.remainingMinutes > 30 ? 1 : 0)} day(s)`
      : `${remaining.remainingHours +
        (remaining.remainingMinutes > 30 ? 1 : 0)} hour(s) remaining`;
  }
  if (remaining.remainingMinutes) {
    return upcomming
      ? `Dans ${remaining.remainingMinutes} minute(s)`
      : `${remaining.remainingMinutes} minute(s) remaining)`;
  }
  return "";
}

/**
 * Gets the remaining time to the end of an event
 * @param endDate date of the end of an event
 * @param startDate [OPTIONAL] date from which we want to calculate the ramining time
 */
function remainingTime(endDate: Date, startDate?: Date): timeInfo {
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;

  const today = new Date();

  const time = timeDifference(endDate, startDate || today);

  return {
    remainingDays: Math.floor(time / oneDay),
    remainingHours: Math.floor((time % oneDay) / oneHour),
    remainingMinutes: Math.floor((time % oneHour) / oneMinute),
  };
}

export {
  getGenshinDayName,
  parseTime,
  remainingTime,
  stringifyRemainingTime,
  timeDifference,
};
