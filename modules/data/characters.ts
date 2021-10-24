import { deserialize, editDist } from "../utils/stringRelated.ts";
import { AsyncFunction } from "../../deps.ts";
import { elementClass, ElementType} from './elements.ts'

export interface CharacterBuild {
  type: string;
  recommended: boolean;
  weapons: [{ id: string }] | [];
  mainStats: { sands: string; goblet: string; circlet: string };
  artifacts: [string[]] | [];
  subStats: [string];
  talent: [string];
  tip: string;
  note: string;
}

export interface Character {
  name: string;
  vision: ElementType;
  roles: [CharacterBuild];
}

class CharactersBuilds {
  private characterState = false;
  private characters: [Character] | undefined;
  private characterNames: [string] | undefined;

  private async fetchApiNames() {
    const res = await fetch("https://api.genshin.dev/characters/");
    const json = await res.json();
    this.characterNames = <[string]> Object.values(json);
  }

  private async fetchCharData(name: string) {
    let apiName: string | undefined;
    name.split("_").reverse().forEach((x) => {
      if (apiName) return;
      this.characterNames?.forEach((y) => {
        if (apiName) return;
        if (y.includes(x)) apiName = y;
      });
    });

    const link = `https://api.genshin.dev/characters/${apiName}`;
    const res = await fetch(link);
    const json = await res.json();
    return json;
  }

  async GetAllCharacters(): Promise<void> {

    if(Object.keys(elementClass.getElements()).length === 0) await elementClass.initElements();

    this.characterState = false;
    interface RolesJSO {
      [index: string]: { roles: Record<string, unknown> };
    }

    const characters: Record<string, unknown> = await new AsyncFunction(
      (await (await fetch(
        "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/build.js",
      )).text()).replace("export const builds =", "return"),
    )();

    await this.fetchApiNames();
    const charactersNames = Object.keys(characters);

    const characterData: Character[] = await Promise.all(
      charactersNames.map(async (characterName) => {
        const roleNames = Object.keys(
          (<RolesJSO> characters)[characterName].roles,
        );
        const editedRoles = roleNames.map((roleName) => {
          const role = <CharacterBuild> (<RolesJSO> characters)[characterName]
            .roles[roleName];
          role.type = roleName;
          return role;
        });

        const capitalizedCharacterName = deserialize(characterName);

        const visionName = (await this.fetchCharData(characterName))["vision"];
        return {
          name: capitalizedCharacterName,
          vision: elementClass.getElement((<string>visionName).toLowerCase()),
          roles: <[CharacterBuild]> editedRoles,
        };
      }),
    );

    this.characters = <[Character]> characterData;
    this.characterState = true;
  }

  getNearestCharacter(input: string): [{id:string, name: string}] {
    const nameMap = this.characters?.map(
      (x) => {
        return {
          character: x,
          name: x.name,
          dist: x.name.toLowerCase().includes(input.toLowerCase()) == true
            ? 0
            : editDist(input, x.name, input.length, x.name.length),
        };
      },
    );
    const differenceMap = nameMap?.sort((a, b) => a.dist - b.dist);

    const nearests = differenceMap?.filter((x) =>
      x.dist === differenceMap[0].dist
    );

    return <[{id:string, name: string}]> nearests?.map((x) => {return {id: x.character.name, name: deserialize(x.character.name)}}).sort();
  }

  getChars = () => {
    return this.characters;
  };

  isChar = (id: string): boolean => {
    return this.characters?.some((x) => x.name === this.getNameFromId(id)) ||
      false;
  };

  getNameFromId = (id: string): string => {
    return id.split("_").map((w) => w.charAt(0).toUpperCase() + w.substr(1))
      .join(" ");
  };

  getCharacterData = (char: string) => {
    return <Character> this.characters?.find((x) => x.name === char);
  };

  getCharacterBuilds = (char: string) => {
    return <[CharacterBuild]> this.getCharacterData(char).roles;
  };
}

const characterBuilds = new CharactersBuilds();

export { characterBuilds };
