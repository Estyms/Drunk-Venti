import { Interaction, InteractionMessageComponentData } from "../deps.ts";
import { characterBuildsInteract } from "./interactions/characterBuildsInteraction.ts";
import { weaponsInteract } from "./interactions/weaponsInteraction.ts";
import { artifactInterract } from "./interactions/artifactsInteraction.ts";

function handleInterract(interaction: Interaction) {
  const id = (<InteractionMessageComponentData>interaction.data).custom_id.split(".")[0]
  switch (id) {
    case "charbuild":
      characterBuildsInteract(interaction);
      return;
    case "weapon":
      weaponsInteract(interaction)
      return;
    case "artifact":
      artifactInterract(interaction);
      return
    default:
      break;
  }

  interaction.respond({
    ephemeral: true,
    embeds: [
      {
        title: "An error has occured",
        color: 0xFF0000,
      },
    ],
  });
}

export { handleInterract };
