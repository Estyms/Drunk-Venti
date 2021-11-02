import { AsyncFunction } from "../../deps.ts";
import { itemClass, ItemType } from "./items.ts";
import { editDist } from "../utils/stringRelated.ts"

export const weapons = {
  sword: {
    id: "sword",
    name: "Sword",
  },
  bow: {
    id: "bow",
    name: "Bow",
  },
  polearm: {
    id: "polearm",
    name: "Polearm",
  },
  claymore: {
    id: "claymore",
    name: "Claymore",
  },
  catalyst: {
    id: "catalyst",
    name: "Catalyst",
  },
};

interface WeaponType {
  id: string;
  name: string;
  rarity: number;
  atk: number;
  secondary: string;
  type: { id: string; name: string };
  source: string;
  ascension: { items: { item: ItemType; amount: number }[], mora: number }[];
  extras: {description: string, skill: {name: string, description: string} | Record <string, never>}
}

interface WeaponsType {
  [id: string]: WeaponType
}

class WeaponClass {
  private weaponList: WeaponsType = {};

  async initWeapons() {

    if (Object.keys(itemClass.getItems()).length === 0) await itemClass.initItems();

    const data : {[id: string]:{description: string, skill: {name: string, description: string} | Record <string, never>}} = JSON.parse(await (await fetch("https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/weapons/en.json")).text());

    let func = (await (await fetch(
      "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/weaponList.js",
    )).text());
    func = func.substr(func.indexOf("export const weaponList ="));
    this.weaponList = await new AsyncFunction("weapons", "itemList",
      func.replace("export const weaponList = ", "return"),
    )(weapons, itemClass.getItems());

    Object.values(this.weaponList).forEach(x=>{
      this.weaponList[x.id].extras = data[x.id];
    })
  }

  getWeapons() {
    return this.weaponList;
  }
  getWeapon(id: string) {
    return this.weaponList[id];
  }

  getNearestWeaponsName(input: string) {
    const nameMap = Object.values(this.weaponList).map(
      (x) => {
        return {
          weapon: x,
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

    return <[WeaponType]>nearests?.map((x) => x.weapon).sort();
  }
}

const weaponClass = new WeaponClass();

export { weaponClass };
export type { WeaponType, WeaponsType }