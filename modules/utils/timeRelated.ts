export enum GenshinServer {
  Asia = 8,
  America = -5,
  Europe = 1
}

function getServerTime(server: GenshinServer) {
  const date = new Date();
  const offset = date.getTimezoneOffset()/60;
  date.setHours(date.getHours() + offset + server);
  return date;
}

function UTCToServerTime(date: Date, server: GenshinServer){
  const serverDate = new Date(date);
  serverDate.setHours(serverDate.getHours() + server);
  return serverDate.getTime()/1000;
}

/**
 * Gets the current day from the Genshin Server standard
 */
function getGenshinDayName(server: GenshinServer) {

  const d = getServerTime(server);

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
  const regex = /(\d{4})[-\/](\d{2})[-\/](\d{2}) (\d{2}):(\d{2}):(\d{2})/;
  const result = regex.exec(time);

  if (!result) return new Date();

  const [year, month, day, hour, minute, seconds] = result.slice(1).map((x)=> Number.parseInt(x));
  
  return new Date(Date.UTC(year, month-1, day, hour, minute, seconds));
}

export {
  getGenshinDayName,
  parseTime,
  UTCToServerTime
};
