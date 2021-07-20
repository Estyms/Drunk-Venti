import { jsObjectFileToJson } from "../utils/jsObjectParser.ts"
import { getGenshinDayName } from "../utils/timeRelated.ts"

interface ItemDict {
    [index: string]: Item
}

interface Item {
    id: string,
    name: string,
    rarity: number
    parent?: string
    day?: string[]
}

interface FarmableItem extends Item {
    day: string[]
}




/**
 * Gets all the Items from the game
 */
async function getItems() : Promise<ItemDict> {
    const itemList: ItemDict = await jsObjectFileToJson("https://github.com/MadeBaruna/paimon-moe/raw/main/src/data/itemList.js") as unknown as ItemDict;
    return itemList;
}


/**
 * Gets the Items that are farmable today
 */
async function getDailyFarmableItems(): Promise<FarmableItem[]> {
    const itemList = await getItems();
    const farmableItemKeys: string[] = Object.keys(itemList).filter((key: string) => itemList[key].day);
    const farmableItems: FarmableItem[] = farmableItemKeys.map(key => itemList[key]) as FarmableItem[];
    const dailyFarmableItems: FarmableItem[] = farmableItems.filter(x => x.day.includes(getGenshinDayName()))
    return dailyFarmableItems;
}



/**
 * Gets the lowest tier of Item from a list of Items
 * @param items List of items
 */
// deno-lint-ignore no-unused-vars
function getLowestGradeItem(items: Item[]): Item[] {
    return items.filter(item => !Object.keys(item).includes("parent"));
}



export { getDailyFarmableItems };
