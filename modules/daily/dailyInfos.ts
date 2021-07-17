import { Server } from "../mongodb.ts"
import { Embed, editMessage } from "../../deps.ts"
import { getDayName } from "../utils/timeRelated.ts"
import { createEmbedEvents } from "./dailyEvents.ts"

async function createDailyEmbedMessages(): Promise<Embed[]> {


    const messages = await createEmbedEvents();

    const message: Embed = {
        title: "Objets farmables aujourd'hui",
        image: { url: `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/daily/${getDayName()}.png` }
    }

    messages.push(message);

    return messages;

}

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