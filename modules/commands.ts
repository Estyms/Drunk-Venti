import { Server, ServerTweet, Tweet } from "./mongodb.ts";
import { Twitter } from "./twitter.ts";
import { createDailyEmbedMessages } from "./daily/dailyInfos.ts";
import { client, Message, TextChannel } from "../deps.ts";
import { webHookManager } from "./utils/webhookManager.ts";

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
      await webHookManager.createChannelWebhook(<string> message.channelID);

      if (server["news_channel"] == String(message.channelID)) {
        const newMsg = await message.reply(
          "You can't set the daily message in the News channel !",
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

      if (server["daily_message_id"]) {
        try {
          const message = await webHookManager.getWebhookMessage(
            <string> server["daily_message_channel"],
            <string> server["daily_message_id"],
          );
          if (message) {
            message.delete();
          }
        } catch {
          "";
        }
      }

      const dailyMessageChannel = <TextChannel> await client.channels.get(
        String(message.channelID),
      );

      const messageData = await webHookManager.sendWebhookMessage(
        dailyMessageChannel.id,
        await createDailyEmbedMessages(),
      );

      if (!messageData.success) {
        const newMsg = await message.reply("An error has occured").catch(
          (e) => {
            console.error(e);
            return undefined;
          },
        );

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 5 * 1000);
        return;
      }

      if (!messageData.message) {
        const newMsg = await message.reply("An error has occured").catch(
          (e) => {
            console.error(e);
            return undefined;
          },
        );

        if (!newMsg) return;

        setTimeout(() => {
          newMsg.delete().catch((e) => console.error(e));
          message.delete().catch((e) => console.error(e));
        }, 5 * 1000);
        return;
      }

      Server.where("guild_id", <string> message.guildID).update({
        daily_message_channel: String(messageData.message.channelID),
        daily_message_id: String(messageData.message.id),
      });

      message.delete();
      break;
    }

    case "help": {
      const newMsg = await message.reply(
" Here are the commands !\
            ```• !dv help : Displays available commands.\n\
\n\
• !dv setNewsChannel : Sets current channel as the News Channel.\n\
\n\
• !dv addTwitterAccount [twitterAccount] : Adds twitterAccount to track list.\n\
\n\
• !dv removeTwitterAccount [twitterAccount] : Removes twitter Account from track list.\n\
\n\
• !dv createDailyMessage : Creates the embed message for daily informations. ```\
",
      ).catch((e) => {
        console.error(e);
        return undefined;
      });

      if (!newMsg) return;

      setTimeout(() => {
        newMsg.delete().catch((e) => console.error(e));
        message.delete().catch((e) => console.error(e));
      }, 30 * 1000);

      break;
    }

    default:
  }
}

export { executeCommand as Commands };
