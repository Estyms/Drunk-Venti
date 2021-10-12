import { Interaction, InteractionMessageComponentData, MessageComponentData, MessageComponentBase} from "../../deps.ts";
import { characterBuilds } from "../builds/characters.ts";
import { deserialize, serialize } from "../utils/stringRelated.ts"

function createBuildActionRows(character : string){
  const components : [MessageComponentData] = [<MessageComponentData>{}];
  components.pop();

  const builds = characterBuilds.getCharacterBuilds(character);
  console.log(builds);
  const rowNumber = Math.ceil(builds.length / 5);

  for (let i = 0; i < rowNumber; i++){
    components.push({type:1, components:[<MessageComponentBase>{}]});
    components[i].components?.pop();
  }

  builds.sort((x,y)=>(x.recommended ? 1 : 0) - (y.recommended ? 1 : 0)).reverse();

  for (let i = 0; i < builds.length; i++){
    components[i/5|0].components?.push({
      type: 2,
      style: builds[i].recommended ? 3 : 1,
      label: builds[i].type,
      customID: `build.${serialize(builds[i].type)}.${serialize(character)}.home`
    })
  }

  return components

}

function createCharacterEmbed(interaction: Interaction, character: string) {
  character = characterBuilds.getNameFromId(character);
  interaction.respond({
    type: 7,
    embeds: [{
      title: `${character}'s builds`,
      description: `Select the build you're interested in !`,
    }],
    components: createBuildActionRows(character)
  });
}


function createBuildEmbed(interaction : Interaction, args: string[]){
  interaction.respond({
    type: 7,
    embeds: [{
      title: `${deserialize(args[2])} - ${deserialize(args[1])}`
    }],
    components : [],
    ephemeral: true
  });
}


function characterBuildsInteract(interaction: Interaction) {
  const id = (<InteractionMessageComponentData> interaction.data).custom_id;
  const args : string[] = id.split(".");
  switch(args[0]){
    case "char":
      console.log(args)
      createCharacterEmbed(interaction, args[1]);
      return;
    case "build":
      createBuildEmbed(interaction, args);
      return;
  }
}

export { characterBuildsInteract };
