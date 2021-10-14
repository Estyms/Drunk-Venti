import { Server, ServerTweet, Tweet } from "./mongodb.ts";
import { Twitter } from "./twitter.ts";
import { createDailyEmbedMessages } from "./daily/dailyInfos.ts";
import {
  Embed,
  Interaction,
  InteractionApplicationCommandData,
  InteractionResponseFlags,
  MessageComponentBase,
  MessageComponentData,
  SlashCommandOptionType,
  SlashCommandPartial,
} from "../deps.ts";
import { webHookManager } from "./utils/webhookManager.ts";
import { characterBuilds } from "./builds/characters.ts";
import { serialize } from "./utils/stringRelated.ts";

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
        required: true,
      },
    ],
  },

  {
    name: "createstatusmessage",
    description: "Create a status message in a channel.",
    options: [
      {
        name: "channel",
        description: "Channel where the status message will be created.",
        type: SlashCommandOptionType.CHANNEL,
        required: true,
      },
    ],
  },

  {
    name: "addtwitteraccount",
    description: "Adds a twitter account to the news channel feed.",
    options: [
      {
        name: "account",
        description: "Twitter account to add.",
        type: SlashCommandOptionType.STRING,
        required: true,
      },
    ],
  },

  {
    name: "removetwitteraccount",
    description: "Removes a twitter account from the news channel feed.",
    options: [
      {
        name: "account",
        description: "Twitter account to remove.",
        type: SlashCommandOptionType.STRING,
        required: true,
      },
    ],
  },
  {
    name: "characterbuilds",
    description: "Shows builds for a Genshin Impact Characters",
    options: [
      {
        name: "character",
        description: "Character to get builds for.",
        type: SlashCommandOptionType.STRING,
        required: true,
      },
    ],
  },
];

export async function createStatusMessage(interaction: Interaction) {
  const server = await Server.where("guild_id", interaction.guild?.id || "")
    .first();

  const options = <InteractionApplicationCommandData> interaction.data;

  const channel = options.options.find((e) => e.name == "channel");

  if (!channel) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description: "Channel not provided",
          color: 0xff0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  await webHookManager.createChannelWebhook(<string> channel.value);

  if (server["news_channel"] == String(channel.value)) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Create Status Message",
          description: `<#${channel.value}> is already the News Channel.`,
          color: 0xffff00,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  // If the message already exists, delete it
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

  const client = await interaction.guild?.me();

  if (!client) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description: `Critical bug guild.me doesn't exists`,
          color: 0xFF0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
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
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  if (!messageData.message) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description: `Critical bug messageData.message doesn't exists`,
          color: 0xFF0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  Server.where("guild_id", <string> interaction.guild?.id || "").update({
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
      }),
    ],
    flags: InteractionResponseFlags.EPHEMERAL,
  });
}

//-----------------------

function createCharacterComponents(
  characters: [string],
): MessageComponentData[] {
  if (characters.length > 25) return [];

  const components: [MessageComponentData] = [<MessageComponentData> {}];
  components.pop();

  const rowNumber = Math.ceil(characters.length / 5.0);
  for (let i = 0; i < rowNumber; i++) {
    components.push({ type: 1, components: [<MessageComponentBase> {}] });
    components[i].components?.pop();
  }

  for (let i = 0; i < characters.length; i++) {
    components[i / 5 | 0].components?.push({
      type: 2,
      label: characters[i],
      style: 1,
      customID: `char.${serialize(characters[i])}`,
    });
  }
  return components;
}

export async function getCharacterBuilds(interaction: Interaction) {
  const options = <InteractionApplicationCommandData> interaction.data;
  const name = <string> options.options.find((n) => n.name === "character")
    ?.value;

  const characterList = characterBuilds.getNearestCharacter(name);

  if (characterList.length > 25) {
    await interaction.respond(
      {
        embeds: [
          {
            title: "An error has occured",
            color: 0xff0000,
            description:
              "Too many character found, please try a more accurate name.",
          },
        ],
        ephemeral: true
      },
    );
    return;
  } else {
    await interaction.respond({
      embeds: [{
        title: "Select the wanted character.",
      }],
      ephemeral: true,
      components: createCharacterComponents(characterList),
    });
  }
}

//-----------------------

export async function setNewsChannel(interaction: Interaction) {
  const server = await Server.where("guild_id", interaction.guild?.id || "")
    .first();

  const options = <InteractionApplicationCommandData> interaction.data;

  const channel = options.options.find((e) => e.name == "channel");

  if (server["news_channel"] == String(channel?.value)) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Set News Channel",
          description: `<#${channel?.value}> is already the News Channel.`,
          color: 0xffff00,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  if (server["daily_message_channel"] == String(channel?.value)) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Set News Channel",
          description: `<#${channel
            ?.value}> is already the Status Message Channel.`,
          color: 0xffff00,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  Server.where("guild_id", String(interaction.guild?.id)).update({
    news_channel: String(channel?.value),
  });

  interaction.respond({
    embeds: [
      new Embed({
        title: "Set News Channel",
        description: `<#${channel?.value}> is now set as the News Channel.`,
        color: 0x00FF00,
        footer: { text: interaction.client.user?.username || "Drunk Venti" },
      }),
    ],
    flags: InteractionResponseFlags.EPHEMERAL,
  });
  return;
}

export async function addTwitterAccount(interaction: Interaction) {
  const server = await Server.where("guild_id", interaction.guild?.id || "")
    .first();

  const options = <InteractionApplicationCommandData> interaction.data;

  const account = options.options.find((e) => e.name == "account");

  const twitterAccount = String(
    <InteractionApplicationCommandData> account?.value,
  );

  if (!twitterAccount) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description: "Twitter account not provided.",
          color: 0xff0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  if (!twitterAccount.match(/^[a-zA-Z0-9_]{0,15}$/)) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description:
            `${twitterAccount} doesn't match the format of a twitter account.`,
          color: 0xff0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  if (!server["news_channel"]) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Add Twitter Account",
          description: `There isn't a News Channel set yet.`,
          color: 0xffff00,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  Twitter.getUserId(twitterAccount).then(async (json) => {
    if (!json || json["errors"]) {
      interaction.respond({
        embeds: [
          new Embed({
            title: "Error",
            description: `${twitterAccount} accounts doesn't exist.`,
            color: 0xff0000,
            footer: {
              text: interaction.client.user?.username || "Drunk Venti",
            },
          }),
        ],
        flags: InteractionResponseFlags.EPHEMERAL,
      });
      return;
    }

    if (
      (await Server.tweets(String(interaction.guild?.id))).find((m) => {
        if (m) return m["user_id"] == json["data"]["id"];
      })
    ) {
      interaction.respond({
        embeds: [
          new Embed({
            title: "Add Twitter Account",
            description: `${twitterAccount} is already tracked.`,
            color: 0xffff00,
            footer: {
              text: interaction.client.user?.username || "Drunk Venti",
            },
          }),
        ],
        flags: InteractionResponseFlags.EPHEMERAL,
      });
      return;
    }

    Twitter.getUserTweets(json["data"]["id"]).then(async (res) => {
      if (!res || res["errors"]) {
        interaction.respond({
          embeds: [
            new Embed({
              title: "Add Twitter Account",
              description: `${twitterAccount} is an invalid account.`,
              color: 0xffff00,
              footer: {
                text: interaction.client.user?.username || "Drunk Venti",
              },
            }),
          ],
          flags: InteractionResponseFlags.EPHEMERAL,
        });
        return;
      }

      if (await Tweet.where("user_id", json["data"]["id"]).count() === 0) {
        Tweet.create([{
          user_id: json["data"]["id"],
        }]);
      }

      ServerTweet.create([{
        serverId: String(interaction.guild?.id),
        tweetId: String(json["data"]["id"]),
      }]);

      interaction.respond({
        embeds: [
          new Embed({
            title: "Add Twitter Account",
            description: `${twitterAccount} is now tracked !`,
            color: 0x00ff00,
            footer: {
              text: interaction.client.user?.username || "Drunk Venti",
            },
          }),
        ],
        flags: InteractionResponseFlags.EPHEMERAL,
      });
      return;
    });
  });
}

export function removeTwitterAccount(interaction: Interaction) {
  const options = <InteractionApplicationCommandData> interaction.data;

  const account = options.options.find((e) => e.name == "account");

  const twitterAccount = String(
    <InteractionApplicationCommandData> account?.value,
  );

  if (!twitterAccount) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description: "Twitter account not provided.",
          color: 0xff0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  if (!twitterAccount.match(/^[a-zA-Z0-9_]{0,15}$/)) {
    interaction.respond({
      embeds: [
        new Embed({
          title: "Error",
          description:
            `${twitterAccount} doesn't match the format of a twitter account.`,
          color: 0xff0000,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  }

  Twitter.getUserId(twitterAccount).then(async (json) => {
    if (!json || !json["data"]) {
      interaction.respond({
        embeds: [
          new Embed({
            title: "Error",
            description: `${twitterAccount} accounts doesn't exist.`,
            color: 0xff0000,
            footer: {
              text: interaction.client.user?.username || "Drunk Venti",
            },
          }),
        ],
        flags: InteractionResponseFlags.EPHEMERAL,
      });
      return;
    }

    if (
      !(await Server.tweets(String(interaction.guild?.id))).find((c) => {
        if (c) return c["user_id"] === json["data"]["id"];
      })
    ) {
      interaction.respond({
        embeds: [
          new Embed({
            title: "Remove Twitter Account",
            description: `${twitterAccount} isn't tracked.`,
            color: 0xffff00,
            footer: {
              text: interaction.client.user?.username || "Drunk Venti",
            },
          }),
        ],
        flags: InteractionResponseFlags.EPHEMERAL,
      });
      return;
    }

    ServerTweet.where({
      serverId: String(interaction.guild?.id),
      tweetId: String(json["data"]["id"]),
    }).delete();

    if (
      await ServerTweet.where("tweetId", json["data"]["id"]).count() === 0
    ) {
      Tweet.where("user_id", json["data"]["id"]).delete();
    }

    interaction.respond({
      embeds: [
        new Embed({
          title: "Remove Twitter Account",
          description: `${twitterAccount} is no longer tracked.`,
          color: 0x00ff00,
          footer: { text: interaction.client.user?.username || "Drunk Venti" },
        }),
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    });
    return;
  });
}
