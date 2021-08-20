import {
  parseTime,
  remainingTime,
  stringifyRemainingTime,
} from "../utils/timeRelated.ts";
import { Embed, EmbedField } from "../../deps.ts";

interface eventData {
  currents: eventItem[];
  upcomming: eventItem;
}

interface eventItem {
  name: string;
  pos: string;
  image: string;
  start: string;
  end: string;
  zoom: string;
  url: string;
  showOnHome: boolean;
  timezoneDependant: boolean;
}

type eventItems = [[eventItem]];

class dailyEvents {
  private AllEvents: eventData | undefined;

  constructor() {
    this.getEventsData();
  }


  /**
 *  Gets all the events of the game
 */
  async getAllEvents(): Promise<eventItems> {
    // deno-lint-ignore prefer-const
    let allEvents: eventItems | undefined;
    eval(
      "allEvents " +
        (await (await (await fetch(
          "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/timeline.js",
        )).text()).replace("export const eventsData", "")),
    );
    allEvents = allEvents as eventItems;
    return allEvents;
  }

  /**
 * Gets all the current event from a list of events
 * @param allEvents List of all the events we want to check
 */
  getCurrentEventsData(allEvents: eventItem[]): eventItem[] {
    const date = new Date();

    const CurrentEvents = allEvents.filter((event) =>
      date >
        parseTime(event.start + (event.timezoneDependant ? " UTC+8" : " ")) &&
      date < parseTime(event.end)
    );
    CurrentEvents.sort((a, b) =>
      parseTime(a.end + (a.timezoneDependant ? " UTC+8" : " ")).valueOf() -
      parseTime(b.end + (a.timezoneDependant ? " UTC+8" : " ")).valueOf()
    );
    CurrentEvents.sort((a, b) => (a.url ? 0 : 1) - (b.url ? 0 : 1));
    return CurrentEvents;
  }

  /**
 * Gets the nearest upcomming Event from a list of event
 * @param allEvents List of all the events we want to check
 */
  getUpcommingEvent(allEvents: eventItem[]): eventItem {
    const date = new Date();

    let UpcommingEvents = allEvents.filter((event) =>
      date < parseTime(event.start)
    );
    UpcommingEvents = UpcommingEvents.sort((a, b) =>
      parseTime(a.start + (a.timezoneDependant ? " UTC+8" : " ")).valueOf() -
      parseTime(b.start + (a.timezoneDependant ? " UTC+8" : " ")).valueOf()
    );

    const UpcommingEvent = UpcommingEvents[0];
    return UpcommingEvent;
  }

  /**
 * Gets all the data needed Event wise
 */
  async getEventsData(): Promise<void> {
    let allEvents = await (await this.getAllEvents()).flat(2);
    allEvents = allEvents.map((x) => {
      x.start = x.start.replace("-", "/");
      if (x.timezoneDependant) {
        x.start += " UTC+8";
      }
      return x;
    });

    const currentEvents = this.getCurrentEventsData(allEvents);

    const upcommingEvent = this.getUpcommingEvent(allEvents);

    this.AllEvents = { currents: currentEvents, upcomming: upcommingEvent };

  }

  /**
 * Creates the Embed messages for all the events
 */
  async createEmbedEvents() {
    this.AllEvents || await this.getEventsData();
    const EventData: eventData = this.AllEvents as eventData;
    const EmbedMessages: Embed[] = [];

    // Current Major Events
    this.AllEvents?.currents.filter(e=>e.url).forEach(event=>
    {
        stringifyRemainingTime(remainingTime(parseTime(event.end))) != "" &&
        EmbedMessages.push(
          new Embed({
            title: event.name,
            url: event.url + "?".repeat(EmbedMessages.length) || undefined,
            image: event.image && event.url
              ? {
                url:
                  `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/events/${event.image}`,
              }
              : undefined,
            description: stringifyRemainingTime(
              remainingTime(parseTime(event.end)),
            ),
            color: Math.round(Math.random() * 0xffffff),
          }),
        );
    });

    const EmbedFields: EmbedField[] = [];

    // Current Minor Events
    EventData.currents.forEach((event) => {
      !event.url &&
        stringifyRemainingTime(remainingTime(parseTime(event.end))) &&
        EmbedFields.push({
          name: event.name,
          value: stringifyRemainingTime(remainingTime(parseTime(event.end))),
        });
    });

    EmbedMessages.push(
      new Embed({
        title: "Autres",
        fields: EmbedFields,
        color: Math.round(Math.random() * 0xffffff),
      }),
    );

    // Upcomming Event
    const nextUpdate = this.getDateOfNextUpdate();
    EmbedMessages.push(
      parseTime(EventData.upcomming.start).valueOf() < nextUpdate.valueOf()
        ? new Embed({
          title: "SOON : " + EventData.upcomming.name,
          url: EventData.upcomming.url + "?".repeat(EmbedMessages.length) || undefined,
          image: EventData.upcomming.image
            ? {
              url:
                `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/events/${EventData.upcomming.image}`,
            }
            : undefined,
          description: stringifyRemainingTime(
            remainingTime(
              parseTime(
                EventData.upcomming.start +
                  (EventData.upcomming.timezoneDependant
                    ? " UTC+8"
                    : " "),
              ),
            ),
            true,
          ),
          color: Math.round(Math.random() * 0xffffff),
        })
        : new Embed({
          title: "SOON : Next update",
          description: stringifyRemainingTime(remainingTime(nextUpdate), true),
          color: Math.round(Math.random() * 0xffffff),
        }),
    );


    return EmbedMessages;
  }

  /**
 * Gets the date of the next Update
 */
  getDateOfNextUpdate() {
    // Date of the 1.5 Update for reference
    const referenceUpdate = new Date(2021, 3, 28, 6, 0, 0, 0);

    // Gets today date
    const today = new Date();

    // Gets the time between today and the reference Update
    const remaining = remainingTime(today, referenceUpdate);

    // Calculate the days remaining to the upcomming update
    const remainingDays = 42 - remaining.remainingDays % 42;

    // Creates the date of the next Update
    const newDate = new Date(today);
    newDate.setDate(newDate.getDate() + remainingDays);
    newDate.setHours(6);
    newDate.setMinutes(0);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    return newDate;
  }
}

const dailyEvent = new dailyEvents();
export { dailyEvent as dailyEvents };
