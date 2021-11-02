import { itemClass, ItemType } from "./items.ts";
import { elementClass, ElementType } from "./elements.ts";
import { weaponClass, weapons } from "./weapons.ts";
import { AsyncFunction } from "../../deps.ts";

interface CharacterType {
  name: string,
  id: string,
  rarity: number,
  element: ElementType,
  weapon: {id: string, name: string},
  sex: string,
  nation: string,
  ascension: [{items:[{item:ItemType,amount:number|null}],mora:number}],
  stats: {[stat:string]:number},
  materials: {
      book: [ItemType],
      material: [ItemType],
      boss: ItemType,
  }
}


interface CharactersType {
  [id: string]: CharacterType;
}

class CharacterClass {
  private characterList: CharactersType = {};

  async initCharacters() {

    if (Object.keys(itemClass.getItems()).length === 0) await itemClass.initItems();
    if (Object.keys(elementClass.getElements()).length === 0) await elementClass.initElements();

    let func = (await (await fetch(
      "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/characters.js",
    )).text());
    func = func.substr(func.indexOf("export const characters ="));
    this.characterList = await new AsyncFunction(
      "weapons",
      "elements",
      "itemList",
      func.replace("export const characters = ", "return"),
    )(weapons, elementClass.getElements(), itemClass.getItems());
}

  getCharacters() {
    return this.characterList;
  }

  getCharacter(id: string) {
    return this.characterList[id];
  }
}

const characterClass = new CharacterClass();

export { characterClass };
export type { CharactersType, CharacterType };
