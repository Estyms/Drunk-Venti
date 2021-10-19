import "./deps.ts";
import { Twitter } from "./modules/twitter.ts";
import { Server, Tweet } from "./modules/mongodb.ts";
import { cron } from "./deps.ts";
import {
  Client,
  ClientActivity,
  Embed,
  event,
  GatewayIntents,
  Guild,
  Interaction,
  InteractionResponseFlags,
  Member,
  Role,
  slash,
} from "./deps.ts";
import { checkPerms, Permissions } from "./modules/utils/checkPerms.ts";
import { webHookManager } from "./modules/utils/webhookManager.ts";
import {
  addTwitterAccount,
  commands,
  createStatusMessage,
  getCharacterBuilds,
  removeTwitterAccount,
  setNewsChannel,
} from "./modules/commands.ts";

import { handleInterract } from "./modules/interactions.ts";

import { updateDailyInfos } from "./modules/daily/dailyInfos.ts";
import { dailyEvents } from "./modules/daily/dailyEvents.ts";
import { characterBuilds } from "./modules/data/characters.ts";

export class DrunkVenti extends Client {
  // Bot startup function
  start() {
    // Tweets
    /*
    this.checkTweets();
    cron("0/15 * * * *", () => {
      this.checkTweets();
    });
    */

    // Data
    dailyEvents.getEventsData();
    characterBuilds.GetAllCharacters();
    cron("0 0/1 * * *", () => {
      dailyEvents.getEventsData();
      characterBuilds.GetAllCharacters();
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
          GatewayIntents.GUILD_INTEGRATIONS,
        ]);
      }
    });

    cron("0/5 * * * *", () => {
      this.setActivity();
    });
  }

  async asyncForEach<T>(array: T[], callback: (x: T) => Promise<void>) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index]);
    }
  }

  async deleteGlobalCommands() {
    const globalCommands = await (await this.interactions.commands.all()).map(
      (x) => {
        return { id: x.id, name: x.name };
      },
    ).filter((x) => !commands.find((y) => y.name != x.name));
    const exec = () =>
      this.asyncForEach(
        globalCommands,
        async (x: { id: string; name: string }) => {
          await this.interactions.commands.delete(x.id);
          this.interactions.commands.all();
          console.log(`Deleted ${x.name}`)
        },
      );

    await exec();
  }

  async initCommands() {
    await this.deleteGlobalCommands();
    for (let i = 0; i < commands.length; i++) {
      try {
        if (
          !(await this.interactions.commands.all()).find((x) =>
            x.name == commands[i].name
          )
        ) {
          await this.interactions.commands.create(commands[i]);
          console.log(`Created ${commands[i].name}`);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  // Checks if a guild is configured properly
  async checkGuild(guild: Guild | Role) {
    if (guild instanceof Role) guild = guild.guild;
    const member = await guild.me();
    let check = false;

    try {
      await this.interactions.commands.for(guild).all();
    } catch {
      check = true;
    }

    if (
      check ||
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
      const ownerDM = await client.createDM(<string> guild.ownerID).catch(
        (e) => {
          console.error(e);
          return undefined;
        },
      );

      if (!ownerDM) return;

      await ownerDM.send(
        `Please give me all the permissions I need ! Without them I wont be able to fulfill my purpose.\nThe permissions I require are the following ones : \`\`Manage Webhook, Send Message, Read Message History, Embed Links, Attach Files, Manage Messages, View Channels and Use Slash Commands\`\`\nYou can use this link to invite me again : https://discord.com/api/oauth2/authorize?client_id=${this
          .user?.id}&permissions=2684480512&scope=bot%20applications.commands`,
      ).catch((e) => console.error(e));
      guild.leave().catch((e) => console.error(e));
    }

    if (!await Server.where("guild_id", guild.id).first()) {
      await Server.create([{
        guild_id: guild.id,
      }]);
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
        if (!json || json["errors"] || !json["meta"]) {
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
          console.error("No data");
          return;
        }

        // Gets all servers that uses this tweet
        Tweet.servers(String(tweet["user_id"])).then((serverList) => {
          // Itterate over all servers
          serverList.forEach(async (server) => {
            if (
              await client.guilds.get(<string> server["guild_id"]) === undefined
            ) {
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

  // Send message to channel
  postMessage(channelId: string, message: string) {
    client.channels.sendMessage(channelId, message).catch((e) =>
      console.error(e)
    );
  }

  unsufficientPermissions(interaction: Interaction) {
    interaction.reply({
      embeds: [
        new Embed({
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
          color: 0xff0000,
          description: "You are not an administrator.",
          title: "Unsufficient Permissions",
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
  }

  async setActivity() {
    const activity: ClientActivity = {
      status: "online",
      since: 0,
      afk: false,
      activity: {
        name: `Drinking in ${
          (await this.guilds.array())
            .length
        } servers !`,
        type: "PLAYING",
      },
    };
    this.setPresence(activity);
  }

  @event("ready")
  ready() {
    this.initCommands().then((_) => {
      console.log("Bot Ready !");
      this.setActivity();
      webHookManager.create(this);
      this.start();
    });
  }

  @event("guildLoaded")
  async guildLoaded(guild: Guild) {
    await this.checkGuild(guild);
  }

  @event("guildCreate")
  async guildCreate(guild: Guild) {
    await this.checkGuild(guild);

    const server = await Server.where("guild_id", String(guild.id)).first();

    if (!server) return;

    if (server["daily_message_channel"] && server["daily_message_id"]) {
      const message = await webHookManager.getMessage(
        <string> server["daily_message_channel"],
        <string> server["daily_message_id"],
      ).catch((_) => {});

      if (message) message.delete().catch((e) => console.error(e));
    }

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
  }

  @event("guildRoleUpdate")
  async guildRoleUpdate(guild: Guild) {
    await this.checkGuild(guild);
  }

  @slash("createstatusmessage")
  CSM(interaction: Interaction) {
    if (
      !checkPerms(
        [Permissions.ADMINISTRATOR],
        <Member> interaction.member,
        true,
      )
    ) {
      this.unsufficientPermissions(interaction);
      return;
    }
    createStatusMessage(interaction);
  }

  @slash("characterbuilds")
  CB(interaction: Interaction) {
    getCharacterBuilds(interaction);
  }

  @event("interactionCreate")
  IC(interaction: Interaction) {
    if (interaction.isMessageComponent()) {
      handleInterract(interaction);
    }
  }

  @slash("addtwitteraccount")
  ATA(interaction: Interaction) {
    if (
      !checkPerms(
        [Permissions.ADMINISTRATOR],
        <Member> interaction.member,
        true,
      )
    ) {
      this.unsufficientPermissions(interaction);
      return;
    }
    addTwitterAccount(interaction);
  }

  @slash("removetwitteraccount")
  RTA(interaction: Interaction) {
    if (
      !checkPerms(
        [Permissions.ADMINISTRATOR],
        <Member> interaction.member,
        true,
      )
    ) {
      this.unsufficientPermissions(interaction);
      return;
    }
    removeTwitterAccount(interaction);
  }

  @slash("setnewschannel")
  SNC(interaction: Interaction) {
    if (
      !checkPerms(
        [Permissions.ADMINISTRATOR],
        <Member> interaction.member,
        true,
      )
    ) {
      this.unsufficientPermissions(interaction);
      return;
    }
    setNewsChannel(interaction);
  }
}

const client = new DrunkVenti();

client.connect(Deno.env.get("DISCORD_TOKEN"), [
  GatewayIntents.GUILDS,
  GatewayIntents.GUILD_MESSAGES,
  GatewayIntents.GUILD_EMOJIS,
  GatewayIntents.GUILD_WEBHOOKS,
  GatewayIntents.GUILD_INTEGRATIONS,
]);
