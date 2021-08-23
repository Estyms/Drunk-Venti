import { Server } from "../mongodb.ts";
import { client, Embed, GatewayIntents } from "../../deps.ts";
import { getGenshinDayName } from "../utils/timeRelated.ts";
import { dailyEvents } from "./dailyEvents.ts";
import { webHookManager } from "../utils/webhookManager.ts";

/**
 * Creates the Embed messages for the Daily Message
 */
async function createDailyEmbedMessages(): Promise<Embed[]> {
  const messages = await dailyEvents.createEmbedEvents();

  const message: Embed = getGenshinDayName() != "sunday"
    ? new Embed({
      title: "Todays Farmable Objects",
      image: {
        url:
          `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/daily/${getGenshinDayName()}.png`,
      },
      color: 0x0099E1,
    })
    : new Embed({
      title: "Todays Farmable Objects",
      description: "It's Sunday, you can farm anything !",
      color: 0x00D166,
    });

  messages.push(message);

  return messages;
}

/**
 * Updates the daily info messages from all servers
 */
async function updateDailyInfos() {
  // We get all the daily messages to update from all server
  const dailyMessageIdList = await Server.select(
    "guild_id",
    "daily_message_id",
    "daily_message_channel",
  ).all();

  // We create the embed messages
  const messages = await createDailyEmbedMessages();

  console.log(dailyMessageIdList);

  // We remove all the servers that do not have a daily message set
  dailyMessageIdList.filter((server) =>
    server["daily_message_id"] && server["daily_message_channel"]
  ).forEach(
    (async (server) => {
      if (await client.guilds.get(<string> server["guild_id"]) == undefined) {
        return;
      }
      const message = await webHookManager.getWebhookMessage(
        <string> server["daily_message_channel"],
        <string> server["daily_message_id"],
      ).catch((e) => console.log(e));

      if (!message) return;

      await webHookManager.editWebhookMessage(
        message,
        message.channelID,
        messages,
      ).catch((e)=>console.log(e));
    }),
  );
}

export { createDailyEmbedMessages, updateDailyInfos };
