import { AsyncFunction } from "../../deps.ts";

const elementColor : {[id:string] : number} = {
    anemo: 0x7fffd4,
    cryo: 0xd6fffa,
    dendro: 0x7de91c,
    electro: 0xbf00ff,
    geo: 0xffbf00,
    hydro: 0x0f5e9c,
    pyro: 0xe35822
}


interface ElementType {
  id: string,
  name: string,
  simpleName: string,
  color: number
}

interface ElementsType {
  [id: string]: ElementType,
}

class ElementClass {
  private elements: ElementsType = {};

  async initElements() {
    this.elements = await new AsyncFunction(
      (await (await fetch(
        "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/elements.js",
      )).text()).replace("export const elements =", "return"),
    )();

    Object.keys(this.elements).forEach(k=>{
        this.elements[k].color = elementColor[k];
    })

  }

  getElements() {
    return this.elements;
  }

  getElement(id: string) {
    return this.elements[id];
  }
}

const elementClass = new ElementClass();

export { elementClass };
export type { ElementsType, ElementType };
