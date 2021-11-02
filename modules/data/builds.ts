import { deserialize, editDist, serialize } from "../utils/stringRelated.ts";
import { AsyncFunction } from "../../deps.ts";
import { elementClass, ElementType } from "./elements.ts";
import { characterClass } from "./characters.ts";

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

export interface CharacterBuilds {
  id: string,
  name: string;
  vision: ElementType;
  roles: [CharacterBuild];
}

class CharactersBuilds {
  private characterState = false;
  private characters: [CharacterBuilds] | undefined;
  private characterNames: [string] | undefined;

  async initBuilds(): Promise<void> {
    if (Object.keys(characterClass.getCharacters()).length === 0) {
      await characterClass.initCharacters();
    }

    if (Object.keys(elementClass.getElements()).length === 0) {
      await elementClass.initElements();
    }

    this.characterState = false;
    interface RolesJSO {
      [index: string]: { roles: Record<string, unknown> };
    }

    const characters: Record<string, unknown> = await new AsyncFunction(
      (await (await fetch(
        "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/build.js",
      )).text()).replace("export const builds =", "return"),
    )();

    const charactersNames = Object.keys(characterClass.getCharacters());

    const characterData: CharacterBuilds[] = charactersNames.map((characterName) => {
      const roleNames = Object.keys(
        (<RolesJSO> characters)[characterName].roles,
      );
      const editedRoles = roleNames.map((roleName) => {
        const role = <CharacterBuild> (<RolesJSO> characters)[characterName]
          .roles[roleName];
        role.type = roleName;
        return role;
      });
      const character = characterClass.getCharacter(characterName);
      const vision = character.element;
      return {
        name: character.name,
        id: character.id,
        vision: vision,
        roles: <[CharacterBuild]> editedRoles,
      };
    });

    this.characters = <[CharacterBuilds]> characterData;
    this.characterState = true;
  }

  getNearestCharacter(input: string): [{ id: string; name: string }] {
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

    return <[{ id: string; name: string }]> nearests?.map((x) => {
      return {
        id: x.character.id,
        name: x.character.name
      };
    }).sort();
  }

  getChars = () => {
    return this.characters;
  };

  isChar = (id: string): boolean => {
    return this.characters?.some((x) => x.name === this.getNameFromId(id)) ||
      false;
  };

  getNameFromId = (id: string): string => {
    return characterClass.getCharacter(id).name;
  };

  getBuildData = (char: string) => {
    return <CharacterBuilds> this.characters?.find((x) => x.name === char);
  };

  getCharacterBuilds = (char: string) => {
    return <[CharacterBuild]> this.getBuildData(char).roles;
  };
}

const characterBuilds = new CharactersBuilds();

export { characterBuilds };
