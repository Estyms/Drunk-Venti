interface timeInfo {
    remainingDays: number,
    remainingHours: number,
    remainingMinutes: number
}


function getGenshinDayName() {
    const d = new Date();
    d.setHours(d.getHours() - 4);
    switch (d.getDay()) {
        case 0: return "sunday";
        case 1: return "monday";
        case 2: return "tuesday";
        case 3: return "wednesday";
        case 4: return "thursday";
        case 5: return "friday";
        case 6: return "saturday";
        default:
            return ""
    }
}

function parseTime(time: string): Date {
    return new Date(time)
}

function timeDifference(date1 : Date, date2 : Date) : number {
    return Math.floor(Math.abs((date1.valueOf() - date2.valueOf())));
}


function stringifyRemainingTime(remaining : timeInfo, upcomming = false) : string {
    if (remaining.remainingDays) return upcomming ? `Dans ${remaining.remainingDays} jour(s)` : `${remaining.remainingDays} jour(s) restant(s)`;
    if (remaining.remainingHours) return upcomming ? `Dans ${remaining.remainingHours} heure(s)` : `${remaining.remainingHours} heure(s) restante(s)`;
    if (remaining.remainingMinutes) return upcomming ? `Dans ${remaining.remainingMinutes} minute(s)` : `${remaining.remainingMinutes} minute(s) restante(s)`;
    return "";
}

function remainingTime(endDate : Date, startDate? :Date) : timeInfo{
    const oneMinute = 60 * 1000;
    const oneHour = 60 * oneMinute;
    const oneDay = 24 * oneHour;

    const today = new Date();

    const time = timeDifference(endDate, startDate || today);

    return {
        remainingDays: Math.floor(time/oneDay),
        remainingHours: Math.floor((time % oneDay) / oneHour),
        remainingMinutes: Math.floor((time % oneHour) / oneMinute)
    }
}




export { getGenshinDayName, parseTime, timeDifference, remainingTime, stringifyRemainingTime}
