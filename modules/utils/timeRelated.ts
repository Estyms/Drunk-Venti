function getDayName() {
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

function dayDifference(date1 : Date, date2 : Date) : number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.valueOf() - date2.valueOf()) / oneDay));
}

function remainingDays(endDate : Date){
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    today.setHours(today.getHours()-4)


    return Math.round(Math.abs((today.valueOf() - endDate.valueOf()) / oneDay));
}


export { getDayName, parseTime, dayDifference, remainingDays}