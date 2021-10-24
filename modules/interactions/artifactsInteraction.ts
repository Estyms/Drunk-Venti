import {
    EmbedPayload,
    Interaction,
    InteractionMessageComponentData,
} from "../../deps.ts";
import { artifactsClass } from "../data/artifacts.ts";
import { domainsClass } from "../data/domains.ts"


function sendArtifactEmbed(interaction: Interaction, artifactId: string) {
    const artifact = artifactsClass.getArtifact(artifactId);

    const embed: EmbedPayload = {
        title: `${artifact.name} | ${":star:".repeat(artifact.rarity[artifact.rarity.length - 1])}`,
        fields: artifact.setPiece.map((x,i)=>{
            return {name: `${x}-Pieces`, value: artifact.bonuses[i].split(".").join(".\n")}
        }),
        thumbnail: {
            url: `https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/static/images/artifacts/${artifact.id}_circlet.png`,
        }
    }

    if (artifact.domain) {
        const domain = domainsClass.getDomain(artifact.domain);
        embed.fields?.push(
            { name: "Domain", value: domain.name }
        )
    }

    interaction.respond({
        type: 7,
        embeds: [embed],
        ephemeral: true
    })
}


export function artifactInterract(interaction: Interaction) {
    const id = (<InteractionMessageComponentData>interaction.data).custom_id;
    const artifactId: string = id.split(".")[1];
    sendArtifactEmbed(interaction, artifactId);
}