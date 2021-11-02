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
  InteractionApplicationCommandOption
} from "../deps.ts";
import { webHookManager } from "./utils/webhookManager.ts";
import { characterBuilds } from "./data/builds.ts";
import { weaponClass } from "./data/weapons.ts";
import { artifactsClass } from "./data/artifacts.ts";

function ERROR_MESSAGE(interaction: Interaction, msg: string) {
  interaction.respond({
    embeds: [
      new Embed({
        title: "Error",
        description: msg,
        color: 0xFF0000,
        footer: { text: interaction.client.user?.username || "Drunk Venti" },
      }),
    ],
    flags: InteractionResponseFlags.EPHEMERAL,
  });
  return;
}

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
    name: "genshin",
    description: "Get Informations about Genshin Impact.",
    options: [
      {
        name: "builds",
        description: "Shows builds for a Genshin Impact Characters",
        type: SlashCommandOptionType.SUB_COMMAND,
        options:[{
          name: "character",
          description: "Character to get builds for.",
          type: SlashCommandOptionType.STRING,
          required: true,
        }]
      },
      {
        name: "weapon",
        description: "Shows infos on a Genshin Impact weapon.",
        type: SlashCommandOptionType.SUB_COMMAND,
        options: [
          {
            name: "weapon",
            description: "Weapon you want infos on.",
            type: SlashCommandOptionType.STRING,
            required: true,
          },
        ],
      },
      {
        name: "artifact",
        description: "Shows infos on a Genshin Impact artifact set.",
        type: SlashCommandOptionType.SUB_COMMAND,
        options: [
          {
            name: "artifact",
            description: "Artifact Set you want infos on.",
            type: SlashCommandOptionType.STRING,
            required: true,
          },
        ],
      },
    ]
  },
];


//-----------------------

export async function createStatusMessage(interaction: Interaction) {
  const server = await Server.where("guild_id", interaction.guild?.id || "")
    .first();

  const options = <InteractionApplicationCommandData>interaction.data;

  const channel = options.options.find((e) => e.name == "channel");

  if (!channel) {
    ERROR_MESSAGE(interaction, "Channel not provided");
    return;
  }

  await webHookManager.createChannelWebhook(<string>channel.value);

  if (server["news_channel"] == String(channel.value)) {
    ERROR_MESSAGE(
      interaction,
      `<#${channel.value}> is already the News Channel.`,
    );
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

  const client = await interaction.guild?.me();

  if (!client) {
    ERROR_MESSAGE(interaction, `Critical bug guild.me doesn't exists`);
  }

  const resolvedChannels = options.resolved?.channels;
  if (!resolvedChannels) return;

  const dailyMessageChannel = resolvedChannels[channel.value];

  const messageData = await webHookManager.sendWebhookMessage(
    dailyMessageChannel.id,
    await createDailyEmbedMessages(),
  );

  if (!messageData.success) {
    ERROR_MESSAGE(interaction, `Critical bug messageData.success isn't true`);
    return;
  }

  if (!messageData.message) {
    ERROR_MESSAGE(
      interaction,
      `Critical bug messageData.message doesn't exists`,
    );

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
      }),
    ],
    flags: InteractionResponseFlags.EPHEMERAL,
  });
}

//------------ PURE GENSHIN -----------


export function genshin(interaction: Interaction){
  const data = <InteractionApplicationCommandData>interaction.data;
  switch (data.options[0].name) {
    case "builds": getCharacterBuilds(interaction, data.options[0]); break;
    case "weapon": weaponData(interaction, data.options[0]); break;
    case "artifact": artifactData(interaction, data.options[0]); break;
    default: break; // Can't Happen
  }
}



/// CHARACTER BUILDS

function createListComponents(
  data: [{ id: string, name: string }], command: string,
): MessageComponentData[] {
  if (data.length > 25) return [];

  const components: [MessageComponentData] = [<MessageComponentData>{}];
  components.pop();

  const rowNumber = Math.ceil(data.length / 5.0);
  for (let i = 0; i < rowNumber; i++) {
    components.push({ type: 1, components: [<MessageComponentBase>{}] });
    components[i].components?.pop();
  }

  for (let i = 0; i < data.length; i++) {
    components[i / 5 | 0].components?.push({
      type: 2,
      label: data[i].name,
      style: 1,
      customID: `${command}.${data[i].id}`,
    });
  }
  return components;
}

/// CHARACTER TYPE

export async function getCharacterBuilds(interaction: Interaction, options: InteractionApplicationCommandOption) {
  if(!options.options) /* Can't  Happen */ return;
  const name = <string>options.options.find((n) => n.name === "character")
    ?.value;

  console.log(name)

  const characterList = characterBuilds.getNearestCharacter(name);

  console.log(name)

  if (!characterList) {
    ERROR_MESSAGE(interaction, "No character found.");
    return;
  } 

  if (characterList.length > 25) {
    ERROR_MESSAGE(interaction, "Too many characters found.");
    return;
  } else {
    await interaction.respond({
      embeds: [{
        title: "Select the wanted character.",
      }],
      ephemeral: true,
      components: createListComponents(characterList, "charbuild.char"),
    });
  }
}


/// WEAPONS

export async function weaponData(interaction: Interaction, options: InteractionApplicationCommandOption) {
  if(!options.options) /* Can't  Happen */ return;
  const name = <string>options.options.find((n) => n.name === "weapon")
    ?.value;

  const list = weaponClass.getNearestWeaponsName(name);
  const components = createListComponents(list, "weapon");
  if (components.length === 0) {
    ERROR_MESSAGE(interaction, "Please be more specific with the Weapon name !")
    return;
  }
  await interaction.respond({
    embeds: [{
      description: "Select the weapon you want infos on !"
    }],
    ephemeral: true,
    components: components,
  })
}

/// ARTIFACT

export async function artifactData(interaction: Interaction, options: InteractionApplicationCommandOption) {
  if(!options.options) /* Can't  Happen */ return;
  const name = <string>options.options.find((n) => n.name === "artifact")
    ?.value;

  const list = artifactsClass.getNearestArtifactName(name);
  const components = createListComponents(list, "artifact");
  if (components.length === 0) {
    ERROR_MESSAGE(interaction, "Please be more specific with the Artifact name !")
    return;
  }
  await interaction.respond({
    embeds: [{
      description: "Select the Artifact you want infos on !"
    }],
    ephemeral: true,
    components: components,
  })
}


//-----------------------

export async function setNewsChannel(interaction: Interaction) {
  const server = await Server.where("guild_id", interaction.guild?.id || "")
    .first();

  const options = <InteractionApplicationCommandData>interaction.data;

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

//-----------------------

export async function addTwitterAccount(interaction: Interaction) {
  const server = await Server.where("guild_id", interaction.guild?.id || "")
    .first();

  const options = <InteractionApplicationCommandData>interaction.data;

  const account = options.options.find((e) => e.name == "account");

  const twitterAccount = String(
    <InteractionApplicationCommandData>account?.value,
  );

  if (!twitterAccount) {
    ERROR_MESSAGE(interaction, "Twitter account not provided.");
    return;
  }

  if (!twitterAccount.match(/^[a-zA-Z0-9_]{0,15}$/)) {
    ERROR_MESSAGE(interaction, `${twitterAccount} doesn't match the format of a twitter account.`)
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

//-----------------------

export function removeTwitterAccount(interaction: Interaction) {
  const options = <InteractionApplicationCommandData>interaction.data;

  const account = options.options.find((e) => e.name == "account");

  const twitterAccount = String(
    <InteractionApplicationCommandData>account?.value,
  );

  if (!twitterAccount) {
    ERROR_MESSAGE(interaction, "Twitter account not provided.");
    return;
  }

  if (!twitterAccount.match(/^[a-zA-Z0-9_]{0,15}$/)) {
    ERROR_MESSAGE(interaction, `${twitterAccount} doesn't match the format of a twitter account.`);
    return;
  }

  Twitter.getUserId(twitterAccount).then(async (json) => {
    if (!json || !json["data"]) {
      ERROR_MESSAGE(interaction, `${twitterAccount} accounts doesn't exist.`)
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
