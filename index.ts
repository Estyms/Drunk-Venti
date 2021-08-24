import "./deps.ts";
import { Twitter } from "./modules/twitter.ts";
import { Server, Tweet } from "./modules/mongodb.ts";
import { client, cron } from "./deps.ts";
import {
  ClientActivity,
  GatewayIntents,
  Guild,
  Member,
  Role,
} from "./deps.ts";
import { checkPerms, Permissions } from "./modules/utils/checkPerms.ts";
import { webHookManager } from "./modules/utils/webhookManager.ts";
import { Commands } from "./modules/commands.ts";
import { updateDailyInfos } from "./modules/daily/dailyInfos.ts";
import { dailyEvents } from "./modules/daily/dailyEvents.ts";

/**
 * Checks if there is tweets to send, and if so, send them
 */
async function checkTweets() {
  // Gets every twitter accounts in the database
  const Tweets: Tweet[] = await Tweet.all();

  // Itterate over every tweets
  Tweets.forEach((tweet: Tweet) => {
    // If an error has occured, skip
    if (tweet["errors"]) return;

    // Gets updated tweet
    Twitter.getUserTweets(String(tweet["user_id"])).then((json) => {
      // If an error has occured skip
      if (!json || json["errors"]) {
        console.error("json is undefined");
        return;
      }

      if (json["meta"]["result_count"] == 0) return;

      // If the latest tweet is already the latest sent, skip
      try {
        if (json["data"][0]["id"] == tweet["tweet_id"]) {
          return;
        }
      } catch {
        console.error("No data")
        return;
      }

      // Gets all servers that uses this tweet
      Tweet.servers(String(tweet["user_id"])).then((serverList) => {
        // Itterate over all servers
        serverList.forEach(async (server) => {
          if (
            await client.guilds.get(<string> server["guild_id"]) === undefined
          ) {
            console.error("Bot not in guild");
            return;
          }

          // Send tweet in news channel
          Twitter.getUsername(String(tweet["user_id"])).then((userJSON) => {

            if (!userJSON){
              console.error("userJSON undefined");
              return;
            } 

            postMessage(
              String(server["news_channel"]),
              `https://twitter.com/${userJSON["data"]["username"]}/status/${
                json["data"][0]["id"]
              }`,
            );

            // Update Tweet object with the latest tweet id
            Tweet.where("user_id", String(tweet["user_id"])).update({
              tweet_id: json["data"][0]["id"],
              tweet_text: json["data"][0]["text"],
            });
          });
        });
      });
    });
  });
}

/**
 * Easy wrapper to send a message in a channel
 * @param channelId Channel where you want to send the message
 * @param message Message you wanna send
 */
function postMessage(channelId: string, message: string) {
  client.channels.sendMessage(channelId, message).catch((e)=>console.error(e));
}

/**
 * Start function for the bot
 */
function start() {
  // Tweets
  checkTweets();
  cron("0/15 * * * *", () => {
    checkTweets();
  });

  // Tweets
  dailyEvents.getEventsData();
  cron("0 0/1 * * *", () => {
    dailyEvents.getEventsData();
  });

  // Embed Messages Infos
  updateDailyInfos();
  cron("0/5 * * * *", () => {
    updateDailyInfos();
  });

  cron("0/5 * * * *", () => {
    if (!client.gateway.connected) {
      client.connect(Deno.env.get("DISCORD_TOKEN"), [
        GatewayIntents.GUILDS,
        GatewayIntents.GUILD_MESSAGES,
        GatewayIntents.GUILD_EMOJIS,
        GatewayIntents.GUILD_WEBHOOKS,
        GatewayIntents.GUILD_INTEGRATIONS,
      ]);
    }
  })

}

client.on("ready", () => {
  console.log("Bot Ready !");
  const activity: ClientActivity = {
    status: "online",
    since: 0,
    afk: false,
    activity: {
      name: "!dv help",
      type: "STREAMING",
    },
  };
  client.setPresence(activity);
  webHookManager.create(client);
  start();
});

client.on("guildLoaded", checkGuild);

client.on("guildCreate", async (guild) => {
  checkGuild(guild);
  const server = await Server.where("guild_id", String(guild.id)).first();

  if (!server) return;

  const message = await webHookManager.getMessage(
    <string> server["daily_message_channel"],
    <string> server["daily_message_id"],
  ).catch(e=>console.error(e))

  if (message) message.delete().catch((e)=>console.error(e));

  
  Server.where("guild_id", String(guild.id)).delete();
  Server.create(
    server["news_channel"]
      ? [{
        guild_id: String(guild.id),
        news_channel: <string> server["news_channel"],
      }]
      : [{
        guild_id: String(guild.id),
      }],
  );
});

client.on("guildRoleUpdate", checkGuild);

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith("!dv")) {
    if (
      !checkPerms([Permissions.ADMINISTRATOR], <Member> message.member, true)
    ) {
      const newMsg = await message.reply("You do not have the required permissions").catch((e)=>{console.error(e);return undefined});
      setTimeout(()=>{newMsg?.delete().catch((e)=>console.error(e))}, 5*1000);
    }

    const args = message.content.split(" ");
    Commands(args[1], message);
  }
});

client.connect(Deno.env.get("DISCORD_TOKEN"), [
  GatewayIntents.GUILDS,
  GatewayIntents.GUILD_MESSAGES,
  GatewayIntents.GUILD_EMOJIS,
  GatewayIntents.GUILD_WEBHOOKS,
  GatewayIntents.GUILD_INTEGRATIONS,
]);

async function checkGuild(guild: Guild | Role) {
  if (guild instanceof Role) guild = guild.guild;
  const member = await guild.me();

  if (
    !checkPerms([
      Permissions.MANAGE_WEBHOOKS,
      Permissions.SEND_MESSAGES,
      Permissions.READ_MESSAGE_HISTORY,
      Permissions.EMBED_LINKS,
      Permissions.ATTACH_FILES,
      Permissions.USE_SLASH_COMMANDS,
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_MESSAGES,
    ], member)
  ) {
    const ownerDM = await client.createDM(<string> guild.ownerID).catch((e)=>{console.error(e); return undefined});

    if(!ownerDM) return;

    await ownerDM.send(
      "Please give me all the permissions I need ! Without them I wont be able to fulfill my purpose.\nThe permissions I require are the following ones : ``Manage Webhook, Send Message, Read Message History, Embed Links, Attach Files and Use Slash Commands``",
    ).catch((e)=>console.error(e));
    guild.leave().catch((e)=>console.error(e));
  }
}
