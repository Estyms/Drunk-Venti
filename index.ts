import "./deps.ts";
import { Twitter } from "./modules/twitter.ts";
import { Tweet } from "./modules/mongodb.ts";
import { client, cron } from "./deps.ts";
import { ClientActivity, GatewayIntents, Member, Guild, Role } from "./deps.ts";
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
      if (json["errors"]) return;

      // If the latest tweet is already the latest sent, skip
      if (json["data"][0]["id"] == tweet["tweet_id"]) {
        return;
      }

      // Update Tweet object with the latest tweet id
      Tweet.where("user_id", String(tweet["user_id"])).update({
        tweet_id: json["data"][0]["id"],
        tweet_text: json["data"][0]["text"],
      });

      // Gets all servers that uses this tweet
      Tweet.servers(json["data"]["id"]).then((serverList) => {
        // Itterate over all servers
        serverList.forEach((server) => {
          // Send tweet in news channel
          Twitter.getUsername(String(tweet["user_id"])).then((userJSON) => {
            postMessage(
              String(server["news_channel"]),
              `https://twitter.com/${userJSON["data"]["username"]}/status/${
                json["data"][0]["id"]
              }`,
            );
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
  client.channels.sendMessage(channelId, message);
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

client.on("guildLoaded", checkGuild)

client.on("guildCreate", checkGuild);

client.on("guildRoleUpdate", checkGuild)

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith("!dv")) {
    if (!checkPerms([Permissions.ADMINISTRATOR], <Member> message.member, true)) {
      console.log(message.member?.permissions.toJSON())
      return message.reply("You do not have the required permissions");
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
    ], member)
  ) {
    const ownerDM = await client.createDM(<string> guild.ownerID);

    await ownerDM.send(
      "Please give me all the permissions I need ! Without them I wont be able to fulfill my purpose.\nThe permissions I require are the following ones : ``Manage Webhook, Send Message, Read Message History, Embed Links, Attach Files and Use Slash Commands``",
    );
    guild.leave();
  }
}
