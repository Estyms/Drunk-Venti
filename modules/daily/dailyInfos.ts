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

  const message: Embed = new Date().getDay() != 0
    ? new Embed({
      title: "Objets farmables aujourd'hui",
      image: {
        url:
          `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/daily/${getGenshinDayName()}.png`,
      },
      color: 0x0099E1,
    })
    : new Embed({
      title: "Objets farmables aujourd'hui",
      description: "On est dimanche, donc tout",
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
    "daily_message_id",
    "daily_message_channel",
  ).all();

  // We create the embed messages
  const messages = await createDailyEmbedMessages();

  // We remove all the servers that do not have a daily message set
  dailyMessageIdList.filter((server) =>
    server["daily_message_id"] && server["daily_message_channel"]
  ).forEach(
    (async (server) => {
      try {
      const message = await webHookManager.getWebhookMessage(
        <string> server["daily_message_channel"],
        <string> server["daily_message_id"],
      );

      if (
        !(await webHookManager.editWebhookMessage(
          message,
          message.channelID,
          messages,
        )).success
      ) {
        throw new Error(
          `Can't edit message for guild ${(await client.guilds.get(
            <string> message.guildID,
          ))?.name}`,
        );
      }
    } catch {
      console.log("Can't edit message");
      client.destroy();
      client.connect(Deno.env.get("DISCORD_TOKEN"), [
        GatewayIntents.GUILDS,
        GatewayIntents.GUILD_MESSAGES,
        GatewayIntents.GUILD_EMOJIS,
        GatewayIntents.GUILD_WEBHOOKS,
        GatewayIntents.GUILD_INTEGRATIONS,
      ]);
      
    }
  }),
  );
}

export { createDailyEmbedMessages, updateDailyInfos };
