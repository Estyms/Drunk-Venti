import { Server } from "../mongodb.ts"
import { Embed, editMessage } from "../../deps.ts"
import { getGenshinDayName } from "../utils/timeRelated.ts"
import { dailyEvents } from "./dailyEvents.ts"


/**
 * Creates the Embed messages for the Daily Message
 */
async function createDailyEmbedMessages(): Promise<Embed[]> {
    const messages = await dailyEvents.createEmbedEvents();

    const message: Embed = new Date().getDay() != 0 ? {
        title: "Objets farmables aujourd'hui",
        image: { url: `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/daily/${getGenshinDayName()}.png` }
    } : {
        title: "Objets farmables aujourd'hui",
        description: "On est dimanche, donc tout"
    }

    messages.push(message);

    return messages;

}


/**
 * Updates the daily info messages from all servers
 */
async function updateDailyInfos() {
    // We get all the daily messages to update from all server
    const dailyMessageIdList = await Server.select("daily_message_id", "daily_message_channel").all();

    // We create the embed messages
    const messages = await createDailyEmbedMessages()

    // We remove all the servers that do not have a daily message set
    dailyMessageIdList.filter((server) => server["daily_message_id"] && server["daily_message_channel"]).forEach((server => {
        editMessage(BigInt(String(server["daily_message_channel"])), BigInt(String(server["daily_message_id"])), {
            content: "",
            embeds: messages
        });
    }))
}


export { updateDailyInfos, createDailyEmbedMessages }