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
  Interaction,
  Embed,
  InteractionResponseFlags,
  Member
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
    this.checkTweets();
    cron("0/15 * * * *", () => {
      this.checkTweets();
    });

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

    cron("0/5 * * * *", () => {
      this.setActivity();
    })
  }

  async asyncForEach<T>(array: T[], callback: (x: T) => Promise<void>) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index]);
    }
  }

  async deleteGlobalCommands(){
    const globalCommands = await (await this.interactions.commands.all()).map(x=>{return {id:x.id, name: x.name}});
    const exec = async () => await this.asyncForEach(globalCommands, async (x: {id: string, name: string})=> {
      await this.interactions.commands.delete(x.id);
    })

    await exec()
  }

  

  async deleteGuildCommands(guild: Guild){
    const guildCommands = await (await this.interactions.commands.guild(guild)).map(x=>{return {id:x.id, name: x.name}});
    const exec = async () => await this.asyncForEach(guildCommands, async (x: {id: string, name: string})=> {
      await this.interactions.commands.delete(x.id, guild);
    })

    await exec()

    return;



  }

  // Setups the commands
  async createCommands(guild: Guild) {
    await this.deleteGuildCommands(guild);
    for (let i = 0; i < commands.length; i++) {
      try {
        if (guild) {
          await this.interactions.commands.create(commands[i], guild);
        }
      } catch (e) {
        console.error(e);
        return true;
      }
    }
    return false;
  }

  // Checks if a guild is configured properly
  async checkGuild(guild: Guild | Role, newServer: boolean) {
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
        newServer ? "Please give me all the permissions I need ! Without them I wont be able to fulfill my purpose.\nThe permissions I require are the following ones : ``Manage Webhook, Send Message, Read Message History, Embed Links, Attach Files and Use Slash Commands``\nYou can use this link to invite me again : https://discord.com/api/oauth2/authorize?client_id=860120094633623552&permissions=2684472320&scope=bot%20applications.commands"
          : "Please add back the bot with the updated permission!\nThere'll be no need to reconfigure I guess.. Appart from the status message.\nhttps://discord.com/api/oauth2/authorize?client_id=860120094633623552&permissions=2684480512&scope=bot%20applications.commands\n\nSincerely, Estym."
      ).catch((e) => console.error(e));
      guild.leave().catch((e) => console.error(e));
    }

    if (!await Server.where("guild_id", guild.id).first()) {
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

  unsufficientPermissions(interaction: Interaction) {
    interaction.reply({
      embeds: [
        new Embed({
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
          color: 0xff0000,
          description: "You are not an administrator.",
          title: "Unsufficient Permissions"
        })
      ],
      flags: InteractionResponseFlags.EPHEMERAL
    })
  }


  async setActivity(){
    const activity: ClientActivity = {
      status: "online",
      since: 0,
      afk: false,
      activity: {
        name: `Drinking in ${await (await this.guilds.array()).length} servers !`,
        type: "PLAYING",
      }
    };
    this.setPresence(activity);
  }


  @event("ready")
  ready() {
    console.log("Bot Ready !");
    this.deleteGlobalCommands();
    this.setActivity();
    webHookManager.create(this);
    this.start();
  }

  @event("guildLoaded")
  async guildLoaded(guild: Guild) {

    this.checkGuild(guild, true);

    if (await this.createCommands(guild)) {
      console.log(`Quitting ${guild.name}`);
      try {
        await this.createDM(guild.ownerID || "").then((x) => x.send("Please add back the bot with the updated permission!\nThere'll be no need to reconfigure I guess.. Appart from the status message.\nhttps://discord.com/api/oauth2/authorize?client_id=860120094633623552&permissions=2684480512&scope=bot%20applications.commands\n\nSincerely, Estym.").then(() => guild.leave()))
      } catch (_) {/** */ }
      return;
    }
  }

  @event("guildCreate")
  async guildCreate(guild: Guild) {

    this.checkGuild(guild, false);

    if (await this.createCommands(guild)) {
      console.log(`Quitting ${guild.name}`);
      try {
        await this.createDM(guild.ownerID || "").then((x) => x.send("Please add back the bot with the updated permission!\nThere'll be no need to reconfigure I guess.. Appart from the status message.\nhttps://discord.com/api/oauth2/authorize?client_id=860120094633623552&permissions=2684480512&scope=bot%20applications.commands\n\nSincerely, Estym.").then(() => guild.leave()))
      } catch (_) {/** */ }
      return;
    }



    const server = await Server.where("guild_id", String(guild.id)).first();

    if (!server) return;

    if (server["daily_message_channel"] && server["daily_message_id"]) {
      const message = await webHookManager.getMessage(
        <string>server["daily_message_channel"],
        <string>server["daily_message_id"],
      ).catch(_ => { })

      if (message) message.delete().catch((e) => console.error(e));
    }

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
    this.checkGuild(guild, false);
  }


  @slash("createstatusmessage")
  CSM(interaction: Interaction) {
    if (!checkPerms([Permissions.ADMINISTRATOR], <Member>interaction.member, true)) {
      this.unsufficientPermissions(interaction)
      return;
    }
    createStatusMessage(interaction)
  }

  @slash("addtwitteraccount")
  ATA(interaction: Interaction) {
    if (!checkPerms([Permissions.ADMINISTRATOR], <Member>interaction.member, true)) {
      this.unsufficientPermissions(interaction)
      return;
    }
    addTwitterAccount(interaction);
  }

  @slash("removetwitteraccount")
  RTA(interaction: Interaction) {
    if (!checkPerms([Permissions.ADMINISTRATOR], <Member>interaction.member, true)) {
      this.unsufficientPermissions(interaction)
      return;
    }
    removeTwitterAccount(interaction);
  }

  @slash("setnewschannel")
  SNC(interaction: Interaction) {
    if (!checkPerms([Permissions.ADMINISTRATOR], <Member>interaction.member, true)) {
      this.unsufficientPermissions(interaction)
      return;
    }
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


