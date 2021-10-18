import {
  GenshinServer,
  parseTime,
  UTCToServerTime,
} from "../utils/timeRelated.ts";
import { AsyncFunction, Embed, EmbedField } from "../../deps.ts";

interface eventData {
  currents: eventItem[];
  upcomming: eventItem;
}

interface eventItem {
  name: string;
  pos: string;
  image: string;
  start: string | number;
  end: string | number;
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
    const allEvents: eventItems = await new AsyncFunction(
      (await (await fetch(
        "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/timeline.js",
      )).text()).replace("export const eventsData = ", "return"),
    )();

    return allEvents as eventItems;
  }

  /**
   * Gets all the current event from a list of events
   * @param allEvents List of all the events we want to check
   */
  getCurrentEventsData(allEvents: eventItem[]): eventItem[] {
    const date = new Date();
    date.setHours(date.getHours() + date.getTimezoneOffset() / 60);

    const CurrentEvents = allEvents.filter((event) =>
      date.getTime() / 1000 > <number> event.start &&
      date.getTime() / 1000 < <number> event.end
    );
    CurrentEvents.sort((a, b) => <number> a.end - <number> b.end);
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
      date.getTime() / 1000 < <number> event.start
    );
    UpcommingEvents = UpcommingEvents.sort((a, b) =>
      <number> a.start - <number> b.start
    );

    const UpcommingEvent = UpcommingEvents[0];
    return UpcommingEvent;
  }

  formatTime(allEvents: eventItem[], server: GenshinServer) {
    return allEvents.map((event) => {
      const x = event;
      if (x.timezoneDependant) {
        x.start = UTCToServerTime(parseTime(<string> x.start), server);
        x.end = parseTime(<string> x.end).getTime() / 1000;
      } else {
        x.start = parseTime(<string> x.start).getTime() / 1000;
        x.end = parseTime(<string> x.end).getTime() / 1000;
      }

      return event;
    });
  }

  /**
   * Gets all the data needed Event wise
   */
  async getEventsData(): Promise<void> {
    let allEvents = (await this.getAllEvents()).flat(2);
    allEvents = this.formatTime(allEvents, GenshinServer.Europe);

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
    this.AllEvents?.currents.filter((e) => e.url).forEach((event) => {
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
          description: `<t:${event.end}:R>`,
          color: Math.round(Math.random() * 0xffffff),
        }),
      );
    });

    const EmbedFields: EmbedField[] = [];

    // Current Minor Events
    EventData.currents.forEach((event) => {
      !event.url &&
        EmbedFields.push({
          name: event.name,
          value: `<t:${event.end}:R>`,
        });
    });

    EmbedMessages.push(
      new Embed({
        title: "Others",
        fields: EmbedFields,
        color: Math.round(Math.random() * 0xffffff),
      }),
    );

    // Upcomming Event
    const nextUpdate = this.getDateOfNextUpdate();
    EmbedMessages.push(
      EventData.upcomming?.start &&
        <number> EventData.upcomming.start < nextUpdate.getTime() / 1000
        ? new Embed({
          title: "SOON : " + EventData.upcomming.name,
          url: EventData.upcomming.url
            ? EventData.upcomming.url + "?".repeat(EmbedMessages.length)
            : undefined,
          image: EventData.upcomming.image
            ? {
              url:
                `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/events/${EventData.upcomming.image}`,
            }
            : undefined,
          description: `<t:${EventData.upcomming.start}:R>`,
          color: Math.round(Math.random() * 0xffffff),
        })
        : new Embed({
          title: "SOON : Next update",
          description: `<t:${nextUpdate.getTime() / 1000}:R>`,
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
    const referenceUpdate = new Date(Date.UTC(2021, 3, 28, 6, 0, 0, 0));

    // Gets today date
    const today = new Date();
    today.setHours(today.getHours() + today.getTimezoneOffset() / 60);
    // Gets the time between today and the reference Update

    while (referenceUpdate.getTime() / 1000 < today.getTime() / 1000) {
      referenceUpdate.setDate(referenceUpdate.getDate() + 42);
    }

    return referenceUpdate;
  }
}

const dailyEvent = new dailyEvents();
export { dailyEvent as dailyEvents };
