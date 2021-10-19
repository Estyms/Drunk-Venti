import { AsyncFunction } from "../../deps.ts";
import { ItemsClass, ItemType } from "./items.ts";

const weapons = {
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

interface WeaponType{
    id: string;
    name: string;
    rarity: number;
    atk: number;
    secondary: string;
    type: { id: string; name: string };
    source: string;
    ascension: { items: { item: ItemType; amount: number }[], mora: number }[];
}

interface WeaponsType {
  [id: string]: WeaponType 
}

class WeaponClass {
  private weaponList: WeaponsType = {};

  async initWeapons() {
    let func = (await (await fetch(
      "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/weaponList.js",
    )).text());
    func = func.substr(func.indexOf("export const weaponList ="));
    this.weaponList = await new AsyncFunction("weapons", "itemList",
      func.replace("export const weaponList = ", "return"),
    )(weapons, ItemsClass.getItems());
  }

  getItems() {
    return this.weaponList;
  }
  getItem(id: string) {
    return this.weaponList[id];
  }
}

const Weapons = new WeaponClass();
Weapons.initWeapons().then(_=>console.log(Weapons.getItems()))

export type {WeaponType, WeaponsType}