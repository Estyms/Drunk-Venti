import { Embed, editMessage, Image, decode } from "../deps.ts"
import { Server } from "./mongodb.ts"


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


function getDayName() {
    const d = new Date();
    d.setHours(d.getHours()-4);
    switch (d.getDay()) {
        case 0: return "sunday";
        case 1: return "monday";
        case 2: return "thursday";
        case 3: return "wednesday";
        case 4: return "tuesday";
        case 5: return "wednesday";
        case 6: return "saturday";
        default:
            return ""
    }
}


async function jsObjectToJson(url: string): Promise<ItemDict> {
    const objectResponse = await fetch(url);
    const regex0 = /export const [a-z-A-Z_0-9]* =/gm;
    const regex1 = /([_a-zA-Z0-9]+):/gm;
    const regex2 = /'([a-zA-Z_ 0-9\n]*)'/gm;
    const regex3 = /,[\s\n]*}/gm

    const objectString = (await objectResponse.text()).replace(regex1, "\"$1\":").replace(regex0, "").replace(regex2, "\"$1\"").replace(regex3, "\n}").replace("};", "}");

    return JSON.parse(objectString) as ItemDict;
}


async function getItems() {
    const itemList: ItemDict = await jsObjectToJson("https://github.com/MadeBaruna/paimon-moe/raw/main/src/data/itemList.js");
    return itemList;
}


async function getDailyFarmableItems(): Promise<FarmableItem[]> {
    const itemList = await getItems();
    const farmableItemKeys: string[] = Object.keys(itemList).filter((key: string) => itemList[key].day);
    const farmableItems: FarmableItem[] = farmableItemKeys.map(key => itemList[key]) as FarmableItem[];
    const dailyFarmableItems: FarmableItem[] = farmableItems.filter(x => x.day.includes(getDayName()))
    return dailyFarmableItems;
}

function getLowestGradeItem(items: Item[]): Item[] {
    return items.filter(item => !Object.keys(item).includes("parent"));
}




async function createDailyEmbedMessages(): Promise<Embed[]> {

    const messages: Embed[] = [] as Embed[];


    const message: Embed = {
        title: "Objets farmables aujourd'hui",
        image: { url: `https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/daily/${getDayName()}.png` }
    }

    messages.push(message)

    return messages;
}


async function updateDailyInfos() {
    // We get all the daily messages to update from all server
    const dailyMessageIdList = await Server.select("daily_message_id", "daily_message_channel").all();

    // We create the embed messages
    const messages = await createDailyEmbedMessages()

    // We remove all the servers that do not have a daily message set
    dailyMessageIdList.filter((server) => server["daily_message_id"] && server["daily_message_channel"]).forEach((server => {
        editMessage(BigInt(String(server["daily_message_channel"])), BigInt(String(server["daily_message_id"])), {
            content: "",
            embeds: messages
        });
    }))
}


export { updateDailyInfos, createDailyEmbedMessages };
