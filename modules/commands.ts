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
      if (server["reminder_channel"] == String(message.channelID)) {
        message.reply("This channel is already the News Channel !");
        break;
      }
      Server.where("guild_id", String(message.guildID)).update({
        news_channel: String(message.channelID),
      });
      message.reply("This channel is now set as the News Channel !");
      break;
    }

    // Adds a twitter account from the news of the server

    case "addTwitterAccount": {
      if (!message.content.split(" ")[2].match(/^[a-zA-Z0-9_]{0,15}$/)) {
        message.reply("This is not a twitter username.");
        break;
      }

      if (!server["news_channel"]) {
        message.reply(
          "Please set News channel first with command ``!dv setNewsChannel`` !",
        );
        break;
      }

      Twitter.getUserId(message.content.split(" ")[2]).then(async (json) => {
        if (json["errors"]) {
          return;
        }

        if (
          (await Server.tweets(String(message.guildID))).find((m) =>
            m["user_id"] == json["data"]["id"]
          )
        ) {
          message.reply("This account is already tracked !");
          return;
        }

        Twitter.getUserTweets(json["data"]["id"]).then(async (res) => {
          if (res["errors"]) {
            message.reply("This Account is invalid.");
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

          message.reply(
            `Account @${json["data"]["username"]} is now tracked !`,
          );
        });
      });
      break;
    }

    // Remove a twitter account from the news of the server

    case "removeTwitterAccount": {
      if (!message.content.split(" ")[2].match(/^[a-zA-Z0-9_]{0,15}$/)) {
        message.reply("This is not a twitter username.");
        break;
      }

      Twitter.getUserId(message.content.split(" ")[2]).then(async (json) => {
        if (
          !(await Server.tweets(String(message.guildID))).find((c) =>
            c["user_id"] === json["data"]["id"]
          )
        ) {
          message.reply("This account isn't tracked !");
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

        message.reply(
          `Account @${json["data"]["username"]} is no longer tracked !`,
        );
      });

      break;
    }

    // Creates the Daily Message

    case "createDailyMessage": {
      await webHookManager.createChannelWebhook(<string> message.channelID);

      if (server["reminder_channel"] == String(message.channelID)) {
        message.reply("You can't set the daily message in the News channel !");
        break;
      }

      if (server["daily_message_id"]) {
        try {
          const message = await webHookManager.getWebhookMessage(
            <string> server["daily_message_channel"],
            <string> server["daily_message_id"],
          )
          if (message) {
            console.log(message.guild?.name)
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
        message.reply("An error has occured");
        return;
      }

      if (!messageData.message) {
        message.reply("An error has occured");
        return;
      }

      console.log(message.guildID);
      console.log(await Server.where("guild_id", <string> message.guildID).all())

      Server.where("guild_id", <string> message.guildID).update({
        daily_message_channel: String(messageData.message.channelID),
        daily_message_id: String(messageData.message.id),
      });

      break;
    }

    case "help": {
      message.reply(
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
      );
      break;
    }

    default:
  }
}

export { executeCommand as Commands };
