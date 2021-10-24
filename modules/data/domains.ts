import { AsyncFunction } from "../../deps.ts";

interface DomainType {
    s: number,
    name: string,
    id: string,
    ar: number,
    level: 34,
    reward: { adventureExp: number, mora: number, friendshipExp: number },
    monsters: [],
    disorder: [string]
}

interface DomainsType {
  [id: string]: DomainType;
}

class DomainClass {
  private domainsList: DomainsType = {};

  async initDomains() {
    this.domainsList = await new AsyncFunction(
      (await (await fetch(
        "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/domain.js",
      )).text()).replace("export const domains =", "return"),
    )();
  }

  getDomains() {
    return this.domainsList;
  }
  getDomain(id: string) {
    return this.domainsList[id];
  }


}

const domainsClass = new DomainClass();

export { domainsClass };
export type { DomainsType, DomainType };
