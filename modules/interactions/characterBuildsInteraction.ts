import {
  EmbedField,
  Interaction,
  InteractionMessageComponentData,
  MessageComponentBase,
  MessageComponentData,
} from "../../deps.ts";
import {
  Character,
  CharacterBuild,
  characterBuilds,
} from "../data/characters.ts";
import { weaponClass } from "../data/weapons.ts";
import { deserialize, serialize } from "../utils/stringRelated.ts";

function createBuildActionRows(character: string) {
  const components: [MessageComponentData] = [<MessageComponentData> {}];
  components.pop();

  const builds = characterBuilds.getCharacterBuilds(character);
  const rowNumber = Math.ceil(builds.length / 5);

  for (let i = 0; i < rowNumber; i++) {
    components.push({ type: 1, components: [<MessageComponentBase> {}] });
    components[i].components?.pop();
  }

  builds.sort((x, y) => (x.recommended ? 1 : 0) - (y.recommended ? 1 : 0))
    .reverse();

  for (let i = 0; i < builds.length; i++) {
    components[i / 5 | 0].components?.push({
      type: 2,
      style: builds[i].recommended ? 3 : 1,
      label: builds[i].type,
      customID: `build.${serialize(builds[i].type)}.${
        serialize(character)
      }.home`,
    });
  }

  return components;
}

function createCharacterEmbed(interaction: Interaction, characterName: string) {
  const characterDeserial = characterBuilds.getNameFromId(characterName);
  const character = characterBuilds.getCharacterData(characterDeserial);

  interaction.respond({
    type: 7,
    embeds: [{
      thumbnail: {
        url:
          `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/characters/${characterName}.png`,
      },
      color: character.vision.color,
      title: `${characterDeserial}'s builds`,
      description: `Select the build you're interested in !`,
      footer: {
        text: `Data from : https://paimon.moe/characters/${characterName}`,
      },
    }],
    components: createBuildActionRows(characterDeserial),
  }).catch((x) => console.log(x));
}

function createMenuComponents(character: Character, build: CharacterBuild) {
  const components: MessageComponentBase = {
    type: 1,
    components: [],
  };

  const pages = ["home", "artifacts", "weapons", "note"];

  components.components = pages.map((x) => {
    return {
      type: 2,
      style: 1,
      label: deserialize(x),
      custom_id: `build.${serialize(build.type)}.${
        serialize(character.name)
      }.${x}`,
    };
  });

  if (build.artifacts.length === 0) {
    components.components = components.components?.filter((x) =>
      !x.custom_id?.includes("artifacts")
    );
  }

  if (build.weapons.length === 0) {
    components.components = components.components?.filter((x) =>
      !x.custom_id?.includes("weapons")
    );
  }

  components.components.push({
    type: 2,
    style: 4,
    label: "Select Other Builds",
    custom_id: `char.${serialize(character.name)}`,
  });

  return components;
}

function homeEmbed(
  interaction: Interaction,
  args: string[],
  character: Character,
  build: CharacterBuild,
) {
  const component = createMenuComponents(character, build);
  component.components = component.components?.filter((x) =>
    !x.custom_id?.includes(args[3])
  );

  interaction.respond({
    type: 7,
    embeds: [{
      color: character.vision.color,
      title: `${deserialize(args[2])} - ${build.type}`,
      thumbnail: {
        url:
          `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/characters/${
            args[2]
          }.png`,
      },
      fields: [
        {
          name: "Best Weapon",
          value: build.weapons.length
            ? (() => {
              const weapon = weaponClass.getWeapon(build.weapons[0].id);
              return `${weapon.name} ${weapon.rarity}⭐`;
            })()
            : "TBD",
          inline: true,
        },
        { name: "Skill Order", value: build.talent.join(" > "), inline: true },
        {
          name: "Best Artifacts",
          value: build.artifacts.length
            ? ((build.artifacts[0].length > 2 ? "Choose 2 : " : "") +
              (build.artifacts[0].map((y) =>
                deserialize(y) +
                ((<string[]> build.artifacts[0]).length - 1 ? " (2)" : " (4)")
              ).join(build.artifacts[0].length > 2 ? " or " : " & ")))
            : "TBD",
        },
        { name: "Circlet", value: build.mainStats.circlet, inline: true },
        { name: "Goblet", value: build.mainStats.goblet, inline: true },
        { name: "Sands", value: build.mainStats.sands, inline: true },
      ],
      footer: {
        text: `Data from : https://paimon.moe/characters/${
          serialize(character.name)
        }`,
      },
    }],
    components: [component],
    ephemeral: true,
  });
}

function artifactsEmbed(
  interaction: Interaction,
  args: string[],
  character: Character,
  build: CharacterBuild,
) {
  const component = createMenuComponents(character, build);
  component.components = component.components?.filter((x) =>
    !x.custom_id?.includes(args[3])
  );

  if (build.artifacts.length == 0) return;

  interaction.respond({
    type: 7,
    embeds: [{
      color: character.vision.color,
      title: `${deserialize(args[2])} - ${build.type}`,
      thumbnail: {
        url:
          `https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/static/images/artifacts/${
            build.artifacts[0][0]
          }_circlet.png`,
      },
      fields: [
        {
          name: "Artifacts",
          value: build.artifacts.map((x, i) =>
            `**${i + 1}. **` + (x.length > 2 ? "Choose 2 : " : "") +
            x.map((y) => deserialize(y) + (x.length - 1 ? " (2)" : " (4)"))
              .join(
                x.length > 2 ? " / " : " & ",
              )
          ).join("\n"),
        },
        {
          name: "Sub Stats",
          value: `${
            build.subStats.map((x, i) => `**${i + 1}. ** ${x}`).join("\n")
          }`,
        },
        { name: "Circlet", value: build.mainStats.circlet, inline: true },
        { name: "Goblet", value: build.mainStats.goblet, inline: true },
        { name: "Sands", value: build.mainStats.sands, inline: true },
      ],
      footer: {
        text: `Data from : https://paimon.moe/characters/${
          serialize(character.name)
        }`,
      },
    }],
    components: [component],
    ephemeral: true,
  });
}

function weaponsEmbed(
  interaction: Interaction,
  args: string[],
  character: Character,
  build: CharacterBuild,
) {
  const component = createMenuComponents(character, build);
  component.components = component.components?.filter((x) =>
    !x.custom_id?.includes(args[3])
  );

  if (build.weapons.length == 0) return;

  interaction.respond({
    type: 7,
    embeds: [{
      color: character.vision.color,
      title: `${deserialize(args[2])} - ${build.type}`,
      thumbnail: {
        url:
          `https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/static/images/weapons/${
            build.weapons[0].id
          }.png`,
      },
      fields: [
        {
          name: "Weapons",
          value: build.weapons.map((x, i) =>
            `**${i + 1}. **` + (() => {
              const weapon = weaponClass.getWeapon(x.id);
              return `${weapon.name} ${weapon.rarity}⭐`;
            })()
          ).join("\n"),
        },
      ],
      footer: {
        text: `Data from : https://paimon.moe/characters/${
          serialize(character.name)
        }`,
      },
    }],
    components: [component],
    ephemeral: true,
  });
}

function noteEmbed(
  interaction: Interaction,
  args: string[],
  character: Character,
  build: CharacterBuild,
) {
  const component = createMenuComponents(character, build);
  component.components = component.components?.filter((x) =>
    !x.custom_id?.includes(args[3])
  );

  const fields: [EmbedField] = [<EmbedField> {}];
  fields.pop();

  if (build.note.length != 0) {
    const notes = build.note.split("\n");
    notes.map((x, i) => {
      if (x) {
        fields.push({
          name: i == 0 ? "Note" : "\u200b",
          value: x,
        });
      }
    });
  } else {
    fields.push({
      name: "Note",
      value: "No notes yet",
    });
  }

  fields.push({
    name: "Tips",
    value: build.tip ? build.tip : "No tips yet",
  });

  interaction.respond({
    type: 7,
    embeds: [{
      color: character.vision.color,
      title: `${deserialize(args[2])} - ${build.type}`,
      thumbnail: {
        url:
          `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/characters/${
            args[2]
          }.png`,
      },
      fields: fields,
      footer: {
        text: `Data from : https://paimon.moe/characters/${
          serialize(character.name)
        }`,
      },
    }],
    components: [component],
    ephemeral: true,
  });
}

function createBuildEmbed(interaction: Interaction, args: string[]) {
  const character = characterBuilds.getCharacterData(
    characterBuilds.getNameFromId(args[2]),
  );
  const build = characterBuilds.getCharacterBuilds(
    characterBuilds.getNameFromId(args[2]),
  ).find((x) => x.type.toLowerCase() == deserialize(args[1]).toLowerCase());
  if (!build) {
    interaction.respond({ type: 1 });
    return;
  }

  switch (args[3]) {
    case "home":
      homeEmbed(interaction, args, character, build);
      break;
    case "artifacts":
      artifactsEmbed(interaction, args, character, build);
      break;
    case "weapons":
      weaponsEmbed(interaction, args, character, build);
      break;
    case "note":
      noteEmbed(interaction, args, character, build);
      break;
  }
}

function characterBuildsInteract(interaction: Interaction) {
  const id = (<InteractionMessageComponentData> interaction.data).custom_id;
  const args: string[] = id.split(".");
  switch (args[0]) {
    case "char":
      createCharacterEmbed(interaction, args[1]);
      return;
    case "build":
      createBuildEmbed(interaction, args);
      return;
  }
}

export { characterBuildsInteract };
