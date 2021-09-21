import { Server, ServerTweet, Tweet } from "./mongodb.ts";
import { Twitter } from "./twitter.ts";
import { createDailyEmbedMessages } from "./daily/dailyInfos.ts";
import { Message, InteractionResponseFlags, SlashCommandOptionType, SlashCommandPartial, Interaction, Embed, InteractionApplicationCommandData, InteractionChannel } from "../deps.ts";
import { webHookManager } from "./utils/webhookManager.ts";


// Every command descriptions
export const commands: SlashCommandPartial[] = [
  {
    name: "setnewschannel",
    description: "Set a channel as the news channel.",
    options: [
      {
        name: "channel",
        description: "Channel to set as the news channel.",
        type: SlashCommandOptionType.CHANNEL,
        required: true
      }
    ]
  },

  {
    name: "createstatusmessage",
    description: "Create a status message in a channel.",
    options: [
      {
        name: "channel",
        description: "Channel where the status message will be created.",
        type: SlashCommandOptionType.CHANNEL,
        required: true
      }
    ]
  },

  {
    name: "addtwitteraccount",
    description: "Adds a twitter account to the news channel feed.",
    options: [
      {
        name: "account",
        description: "Twitter account to add.",
        type: SlashCommandOptionType.STRING,
        required: true
      }
    ]
  },

  {
    name: "removetwitteraccount",
    description: "Removes a twitter account from the news channel feed.",
    options: [
      {
        name: "account",
        description: "Twitter account to remove.",
        type: SlashCommandOptionType.STRING,
        required: true
      }
    ]
  }
]





export async function createStatusMessage(interaction: Interaction) {

  const server = await Server.where("guild_id", interaction.guild?.id || "").first();

  const options = <InteractionApplicationCommandData>interaction.data;

  let channel = options.options.find(e => e.name == "channel")

  if (!channel) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description: "Channel not provided",
          color: 0xff0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" }
        })
      ],
      flags: InteractionResponseFlags.EPHEMERAL
    })
    return;
  }

  await webHookManager.createChannelWebhook(<string>channel.value);

  if (server["news_channel"] == String(channel.value)){
    interaction.respond({
      embeds: [
        new Embed({
          title: "Create Status Message",
          description: `<#${channel.value}> is already the News Channel.`,
          color: 0x00FFFF,
          footer: { text: interaction.client.user?.username || "Drunk Venti" }
        })
      ],
      flags: InteractionResponseFlags.EPHEMERAL
    })
    return;
  }

  // If the message already exists, delete it
  if (server["daily_message_id"]) {
    try {
      const message = await webHookManager.getWebhookMessage(
        <string>server["daily_message_channel"],
        <string>server["daily_message_id"],
      );
      if (message) {
        message.delete();
      }
    } catch {
      "";
    }
  }

  const client = await interaction.guild?.me()

  if (!client){
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description: `Critical bug guild.me doesn't exists`,
          color: 0xFF0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" }
        })
      ],
      flags: InteractionResponseFlags.EPHEMERAL
    })
    return;
  }


  const resolvedChannels = options.resolved?.channels;
  if (!resolvedChannels) return;

  const dailyMessageChannel = resolvedChannels[channel.value];


  const messageData = await webHookManager.sendWebhookMessage(
    dailyMessageChannel.id,
    await createDailyEmbedMessages(),
  );

  if (!messageData.success) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description: `Critical bug messageData.success isn't true`,
          color: 0xFF0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" }
        })
      ],
      flags: InteractionResponseFlags.EPHEMERAL
    })
    return;
  }

  if (!messageData.message) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description: `Critical bug messageData.message doesn't exists`,
          color: 0xFF0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" }
        })
      ],
      flags: InteractionResponseFlags.EPHEMERAL
    })
    return;
  }

  Server.where("guild_id", <string>interaction.guild?.id || "").update({
    daily_message_channel: String(messageData.message.channelID),
    daily_message_id: String(messageData.message.id),
  });
  
  interaction.respond({
    embeds: [
      new Embed({
        title: "Create Status Message",
        description: `Status Message created successfully`,
        color: 0x00FF00,
        footer: { text: interaction.client.user?.username || "Drunk Venti" },
      })
    ],
    flags: InteractionResponseFlags.EPHEMERAL
  })

}





/**
 * Executes a command
 * @param command The command that is executed
 * @param message The message that contains the command
 */
async function executeCommand(command: string, message: Message) {
  const serverTest = await Server.where("guild_id", String(message.guildID))
    .first();

  if (!serverTest) {
    await Server.create([{
      guild_id: String(message.guildID),
    }]);
  }

  const server = await Server.where("guild_id", String(message.guildID))
    .first();

  switch (command) {
    // Sets the News Channel
    case "setNewsChannel": {
      if (server["news_channel"] == String(message.channelID)) {
        const newMsg = await message.reply(
          "This channel is already the News Channel !",
        ).catch((e) => {
          console.error(e);
          return undefined;
        });

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 5 * 1000);
        break;
      }

      if (server["daily_message_channel"] == String(message.channelID)) {
        const newMsg = await message.reply(
          "You can't set the News Channel in the same channel as the Daily Message !",
        ).catch((e) => {
          console.error(e);
          return undefined;
        });

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 5 * 1000);
        break;
      }

      Server.where("guild_id", String(message.guildID)).update({
        news_channel: String(message.channelID),
      });

      const newMsg = await message.reply(
        "This channel is now set as the News Channel !",
      ).catch((e) => {
        console.error(e);
        return undefined;
      });

      if (!newMsg) return;

      setTimeout(() => {
        newMsg.delete().catch((e) => console.error(e));
        message.delete().catch((e) => console.error(e));
      }, 5 * 1000);
      break;
    }

    // Adds a twitter account from the news of the server

    case "addTwitterAccount": {
      const args = message.content.split(" ");

      if (args.length < 3) {
        const newMsg = await message.reply(
          "Please refer to ``!dv help`` for the syntax.",
        ).catch((e) => {
          console.error(e);
          return undefined;
        });

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 5 * 1000);
        break;
      }

      if (!args[2].match(/^[a-zA-Z0-9_]{0,15}$/)) {
        const newMsg = await message.reply("This is not a twitter username.")
          .catch((e) => {
            console.error(e);
            return undefined;
          });

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 5 * 1000);
        break;
      }

      if (!server["news_channel"]) {
        const newMsg = await message.reply(
          "Please set News channel first with command ``!dv setNewsChannel`` !",
        ).catch((e) => {
          console.error(e);
          return undefined;
        });

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 5 * 1000);
        break;
      }

      Twitter.getUserId(message.content.split(" ")[2]).then(async (json) => {
        if (!json || json["errors"]) {
          return;
        }

        if (
          (await Server.tweets(String(message.guildID))).find((m) => {
            if (m) return m["user_id"] == json["data"]["id"];
          })
        ) {
          const newMsg = await message.reply(
            "This account is already tracked !",
          ).catch((e) => {
            console.error(e);
            return undefined;
          });

          if (!newMsg) return;

          setTimeout(() => {
            newMsg.delete().catch((e) => console.error(e));
            message.delete().catch((e) => console.error(e));
          }, 10 * 1000);
          return;
        }

        Twitter.getUserTweets(json["data"]["id"]).then(async (res) => {
          if (!res || res["errors"]) {
            const newMsg = await message.reply("This Account is invalid.")
              .catch((e) => {
                console.error(e);
                return undefined;
              });

            if (!newMsg) return;

            setTimeout(() => {
              newMsg.delete().catch((e) => console.error(e));
              message.delete().catch((e) => console.error(e));
            }, 10 * 1000);
            return;
          }

          if (await Tweet.where("user_id", json["data"]["id"]).count() === 0) {
            Tweet.create([{
              user_id: json["data"]["id"],
            }]);
          }

          ServerTweet.create([{
            serverId: String(message.guildID),
            tweetId: String(json["data"]["id"]),
          }]);

          const newMsg = await message.reply(
            `Account @${json["data"]["username"]} is now tracked !`,
          ).catch((e) => {
            console.error(e);
            return undefined;
          });

          if (!newMsg) return;

          setTimeout(() => {
            newMsg.delete().catch((e) => console.error(e));
            message.delete().catch((e) => console.error(e));
          }, 10 * 1000);
        });
      });
      break;
    }

    // Remove a twitter account from the news of the server

    case "removeTwitterAccount": {
      const args = message.content.split(" ");

      if (args.length < 3) {
        const newMsg = await message.reply(
          "Please refer to ``!dv help`` for the syntax.",
        ).catch((e) => {
          console.error(e);
          return undefined;
        });

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 5 * 1000);
        break;
      }

      if (!args[2].match(/^[a-zA-Z0-9_]{0,15}$/)) {
        const newMsg = await message.reply("This is not a twitter username.")
          .catch((e) => {
            console.error(e);
            return undefined;
          });

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 5 * 1000);
        break;
      }

      Twitter.getUserId(message.content.split(" ")[2]).then(async (json) => {
        if (!json) return;

        if (
          !(await Server.tweets(String(message.guildID))).find((c) => {
            if (c) c["user_id"] === json["data"]["id"];
          })
        ) {
          const newMsg = await message.reply("This account isn't tracked !")
            .catch((e) => {
              console.error(e);
              return undefined;
            });

          if (!newMsg) return;

          setTimeout(() => {
            newMsg.delete().catch((e) => console.error(e));
            message.delete().catch((e) => console.error(e));
          }, 10 * 1000);
          return;
        }

        ServerTweet.where({
          serverId: String(message.guildID),
          tweetId: String(json["data"]["id"]),
        }).delete();

        if (
          await ServerTweet.where("tweetId", json["data"]["id"]).count() === 0
        ) {
          Tweet.where("user_id", json["data"]["id"]).delete();
        }

        const newMsg = await message.reply(
          `Account @${json["data"]["username"]} is no longer tracked !`,
        ).catch((e) => {
          console.error(e);
          return undefined;
        });

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 10 * 1000);
      });

      break;
    }

    // Creates the Daily Message

    case "createDailyMessage": {

    }

    default:
      break;
  }
}

export { executeCommand as Commands };
