import "./deps.ts";
import { Twitter } from "./modules/twitter.ts";
import { Server, Tweet } from "./modules/mongodb.ts";
import { cron } from "./deps.ts";
import {
  ClientActivity,
  GatewayIntents,
  Guild,
  Role,
  Client,
  event,
  slash,
  Interaction
} from "./deps.ts";
import { checkPerms, Permissions } from "./modules/utils/checkPerms.ts";
import { webHookManager } from "./modules/utils/webhookManager.ts";
import { commands, createStatusMessage, addTwitterAccount, removeTwitterAccount, setNewsChannel } from "./modules/commands.ts";
import { updateDailyInfos } from "./modules/daily/dailyInfos.ts";
import { dailyEvents } from "./modules/daily/dailyEvents.ts";



export class DrunkVenti extends Client {
  // Bot startup function
  start() {
    // Tweets
    /*checkTweets();
    cron("0/15 * * * *", () => {
      checkTweets();
    });*/

    // Tweets
    dailyEvents.getEventsData();
    cron("0 0/1 * * *", () => {
      dailyEvents.getEventsData();
    });

    // Embed Messages Infos
    updateDailyInfos(this);
    cron("0/5 * * * *", () => {
      updateDailyInfos(this);
    });

    cron("0/5 * * * *", () => {
      if (!this.gateway.connected) {
        this.connect(Deno.env.get("DISCORD_TOKEN"), [
          GatewayIntents.GUILDS,
          GatewayIntents.GUILD_MESSAGES,
          GatewayIntents.GUILD_EMOJIS,
          GatewayIntents.GUILD_WEBHOOKS,
          GatewayIntents.GUILD_INTEGRATIONS,
          GatewayIntents.GUILD_INTEGRATIONS
        ]);
      }
    })
  }

  // Setups the commands
  createCommands(guild : Guild) {
    commands.forEach(command => {
      this.interactions.commands.create(command, guild);
    })
  }

  // Checks if a guild is configured properly
  async checkGuild(guild: Guild | Role) {
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
      const ownerDM = await client.createDM(<string>guild.ownerID).catch((e) => { console.error(e); return undefined });

      if (!ownerDM) return;

      await ownerDM.send(
        "Please give me all the permissions I need ! Without them I wont be able to fulfill my purpose.\nThe permissions I require are the following ones : ``Manage Webhook, Send Message, Read Message History, Embed Links, Attach Files and Use Slash Commands``",
      ).catch((e) => console.error(e));
      guild.leave().catch((e) => console.error(e));
    }

    if (!await Server.where("guild_id", guild.id).first()){
      await Server.create([{
        guild_id: guild.id
      }])
    }

  }

  // Checks if there are new tweets
  async checkTweets() {
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
              await client.guilds.get(<string>server["guild_id"]) === undefined
            ) {
              console.error("Bot not in guild");
              return;
            }

            // Send tweet in news channel
            Twitter.getUsername(String(tweet["user_id"])).then((userJSON) => {

              if (!userJSON) {
                console.error("userJSON undefined");
                return;
              }

              this.postMessage(
                String(server["news_channel"]),
                `https://twitter.com/${userJSON["data"]["username"]}/status/${json["data"][0]["id"]
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

  // Send message to channel
  postMessage(channelId: string, message: string) {
    client.channels.sendMessage(channelId, message).catch((e) => console.error(e));
  }

  @event("ready")
  ready() {
    console.log("Bot Ready !");
    const activity: ClientActivity = {
      status: "online",
      since: 0,
      afk: false,
      activity: {
        name: "Getting drunk",
        type: "PLAYING"
      }
    };
    this.setPresence(activity);
    webHookManager.create(this);
    this.start();
  }

  @event("guildLoaded")
  guildLoaded(guild: Guild) {
    this.checkGuild(guild);
    try {
      this.createCommands(guild);
    } catch (_e){
      console.log(`Quitting ${guild.name}`);
      this.createDM(guild.ownerID || "").then((x)=> x.send("Please add back the bot with the updated permission !"))
      guild.leave();
    }
  }

  @event("guildCreate")
  async guildCreate(guild: Guild) {
    this.checkGuild(guild);

    try {
      this.createCommands(guild);
    } catch (_e){
      console.log(`Quitting ${guild.name}`);
      this.createDM(guild.ownerID || "").then((x)=> x.send("Please add back the bot with the updated permission !"))
      guild.leave();
    }

    const server = await Server.where("guild_id", String(guild.id)).first();

    if (!server) return;

    const message = await webHookManager.getMessage(
      <string>server["daily_message_channel"],
      <string>server["daily_message_id"],
    ).catch(e => console.error(e))

    if (message) message.delete().catch((e) => console.error(e));


    Server.where("guild_id", String(guild.id)).delete();
    Server.create(
      server["news_channel"]
        ? [{
          guild_id: String(guild.id),
          news_channel: <string>server["news_channel"],
        }]
        : [{
          guild_id: String(guild.id),
        }],
    );
  }

  @event("guildRoleUpdate")
  guildRoleUpdate(guild: Guild) {
    this.checkGuild(guild);
  }


  @slash("createstatusmessage")
  CSM(interaction: Interaction) {
    createStatusMessage(interaction)
  }

  @slash("addtwitteraccount")
  ATA(interaction: Interaction) {
    addTwitterAccount(interaction);
  }

  @slash("removetwitteraccount")
  RTA(interaction: Interaction) {
    removeTwitterAccount(interaction);
  }

  @slash("setnewschannel")
  SNC(interaction: Interaction) {
    setNewsChannel(interaction);
  }


}



/**
 * Checks if there is tweets to send, and if so, send them
 */


/**
 * Easy wrapper to send a message in a channel
 * @param channelId Channel where you want to send the message
 * @param message Message you wanna send
 */


const client = new DrunkVenti();

client.connect(Deno.env.get("DISCORD_TOKEN"), [
  GatewayIntents.GUILDS,
  GatewayIntents.GUILD_MESSAGES,
  GatewayIntents.GUILD_EMOJIS,
  GatewayIntents.GUILD_WEBHOOKS,
  GatewayIntents.GUILD_INTEGRATIONS,
]);


