import {
    EmbedPayload,
    Interaction,
    InteractionMessageComponentData,
} from "../../deps.ts";
import {capitalize} from "../utils/stringRelated.ts"
import { weaponClass } from "../data/weapons.ts";


function sendWeaponEmbed(interaction: Interaction, weaponId: string) {
    const weapon = weaponClass.getWeapon(weaponId);
    const embed : EmbedPayload = {
            title: `${weapon.name} | ${":star:".repeat(weapon.rarity)}`,
            description: `${weapon.extras.description}`,
            fields: [
                {name: "Main Stat",value: weapon.secondary, inline: true},
                {name: "Source", value: weapon.source.split(" ").map(capitalize).join(" ").replace(",", " |"), inline: true},
                {name:'\u200b', value:'\u200b', inline: true},
                {name: "Type", value: weapon.type.name, inline: true},
                {name: "Ascension Item", value: <string>weapon.ascension[weapon.ascension.length-1].items.find(x=>x.item.day)?.item.name, inline: true},
                {name:'\u200b', value:'\u200b', inline: true},
            ],
            thumbnail: {
                url: `https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/static/images/weapons/${weapon.id}.png`,
            }
    }

    if (Object.keys(weapon.extras.skill).length){
        embed.fields?.splice(0,0,{name: `Passive - ${weapon.extras.skill.name}`,value: weapon.extras.skill.description.replace(/(<([^>]+)>)/gi, "**").split(".").join(".\n")})
    }

    interaction.respond({
        type: 7,
        embeds: [embed],
        ephemeral: true
    })
}


export function weaponsInteract(interaction: Interaction) {
    const id = (<InteractionMessageComponentData>interaction.data).custom_id;
    const weaponId: string = id.split(".")[1];
    sendWeaponEmbed(interaction, weaponId);
}