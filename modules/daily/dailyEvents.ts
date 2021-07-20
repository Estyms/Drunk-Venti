import { parseTime, remainingTime, stringifyRemainingTime } from "../utils/timeRelated.ts"
import { Embed, EmbedField } from "../../deps.ts"

interface eventData {
    currents: eventItem[],
    upcomming: eventItem
}

interface eventItem {
    name: string,
    pos: string,
    image: string,
    start: string,
    end: string,
    zoom: string,
    url: string,
    showOnHome: boolean
}

type eventItems = [[eventItem]]

/**
 *  Gets all the events of the game 
 */
async function getAllEvents(): Promise<eventItems> {
    // deno-lint-ignore prefer-const
    let allEvents: eventItems | undefined;
    eval("allEvents " + (await (await (await fetch("https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/timeline.js")).text()).replace("export const eventsData", "")));
    allEvents = allEvents as eventItems;
    return allEvents;
}

/**
 * Gets all the current event from a list of events
 * @param allEvents List of all the events we want to check
 */
function getCurrentEventsData(allEvents: eventItem[]): eventItem[] {
    const date = new Date();

    const CurrentEvents = allEvents.filter(event => date > parseTime(event.start) && date < parseTime(event.end))
    CurrentEvents.sort((a, b) => parseTime(a.end).valueOf() - parseTime(b.end).valueOf());
    CurrentEvents.sort((a,b) => (a.url ? 0 : 1) - (b.url ? 0 : 1))
    return CurrentEvents
}


/**
 * Gets the nearest upcomming Event from a list of event
 * @param allEvents List of all the events we want to check
 */
function getUpcommingEvent(allEvents: eventItem[]): eventItem {
    const date = new Date();

    const UpcommingEvents = allEvents.filter(event => date < parseTime(event.start))
    UpcommingEvents.sort((a, b) => parseTime(a.end).valueOf() - parseTime(b.end).valueOf());

    const UpcommingEvent = UpcommingEvents[0]
    return UpcommingEvent;
}


/**
 * Gets all the data needed Event wise
 */
async function getEventsData(): Promise<eventData> {
    const allEvents = await (await getAllEvents()).flat(2)
    const currentEvents = getCurrentEventsData(allEvents);
    const upcommingEvent = getUpcommingEvent(allEvents)

    return { currents: currentEvents, upcomming: upcommingEvent }
}


/**
 * Creates the Embed messages for all the events
 */
async function createEmbedEvents(){
    const EventData = await getEventsData();
    const EmbedMessages : Embed[] = [];

    // Current Major Events
    EventData.currents.forEach(event => {
        event.url &&
        stringifyRemainingTime(remainingTime(parseTime(event.end))) != ""
        &&
        EmbedMessages.push({
            title: event.name,
            url: event.url || undefined,
            image: event.image && event.url ? {url:`https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/events/${event.image}`} : undefined,
            description: stringifyRemainingTime(remainingTime(parseTime(event.end)))
        })
    });

    const EmbedFields : EmbedField[] = []

    // Current Minor Events
    EventData.currents.forEach(event => {
        !event.url &&
        stringifyRemainingTime(remainingTime(parseTime(event.end)))
        &&
        EmbedFields.push({
            name: event.name,
            value: stringifyRemainingTime(remainingTime(parseTime(event.end)))
        })
    })

    EmbedMessages.push({
        title: "Autres",
        fields: EmbedFields
    })
    

    // Upcomming Event 
    const nextUpdate = getDateOfNextUpdate();
    EmbedMessages.push(parseTime(EventData.upcomming.start).valueOf() < nextUpdate.valueOf() ? {
            title: "BIENTÔT : " + EventData.upcomming.name,
            url: EventData.upcomming.url || undefined,
            image: EventData.upcomming.image ? {url:`https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/events/${EventData.upcomming.image}`} : undefined,
            description: stringifyRemainingTime(remainingTime(parseTime(EventData.upcomming.start)), true)
    }: {
        title: "BIENTÔT : Nouvelle Mise à jour",
        description: stringifyRemainingTime(remainingTime(nextUpdate), true)
    })

    return EmbedMessages;
}




/**
 * Gets the date of the next Update
 */
function getDateOfNextUpdate() {
    // Date of the 1.5 Update for reference
    const referenceUpdate = new Date(2021, 3, 28, 6, 0, 0, 0);

    // Gets today date
    const today = new Date();
    
    // Gets the time between today and the reference Update
    const remaining = remainingTime(today, referenceUpdate)

    // Calculate the days remaining to the upcomming update
    const remainingDays = 42 - remaining.remainingDays % 42;

    // Creates the date of the next Update
    const newDate = new Date(today)
    newDate.setDate(newDate.getDate() + remainingDays);
    newDate.setHours(6)
    newDate.setMinutes(0)
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)

    return newDate
}


export { getEventsData, createEmbedEvents }