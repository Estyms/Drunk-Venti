import { Interaction } from "../deps.ts";
import { characterBuildsInteract } from "./interactions/characterBuildsInteraction.ts";

function handleInterract(interaction: Interaction) {
  switch (interaction.message?.interaction?.name) {
    case "characterbuilds":
      characterBuildsInteract(interaction);
      return;
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
