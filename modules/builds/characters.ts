import {editDist, deserialize} from "../utils/stringRelated.ts";

export interface CharacterBuild {
    type: string,
    recommended: boolean,
    weapons: [{id:string}] | [],
    mainStats: {sands:string, goblet: string, circlet:string},
    artifacts: [string[]] | [],
    subStats: [string],
    talent: [string],
    tip: string,
    note: string
}

class Vision {
    static readonly ANEMO   = new Vision("Anemo",   0x7fffd4);
    static readonly CRYO    = new Vision("Cryo",    0xd6fffa);
    static readonly DENDRO  = new Vision("Dendro",  0x7de91c);
    static readonly ELECTRO = new Vision("Electro", 0xbf00ff);
    static readonly GEO     = new Vision("Geo",     0xffbf00);
    static readonly HYDRO   = new Vision("Hydro",   0x0f5e9c);
    static readonly PYRO    = new Vision("Pyro",    0xe25822)

    static visions : Vision[] = [this.ANEMO, this.CRYO, this.DENDRO, this.ELECTRO, this.GEO, this.HYDRO, this.PYRO]


    constructor(private readonly name: string, private readonly color: number){
    }

    getColor = () => {
        return this.color
    }

    static getVision(visionName: string){
        return this.visions.find(x=>x.name === visionName);
    }
}


export interface Character {
    name: string,
    vision: Vision
    roles: [CharacterBuild]
}


class CharactersBuilds {

    private characterState = false;
    private characters : [Character] | undefined;
    private characterNames: [string] | undefined;
    
    
    private async fetchApiNames(){
        const res = await fetch("https://api.genshin.dev/characters/");
        const json = await res.json();
        this.characterNames = <[string]>Object.values(json);
    }

    private async fetchCharData(name: string) {
        let apiName: string | undefined;
        name.split("_").reverse().forEach(x=>{
            if (apiName) return;
            this.characterNames?.forEach(y=>{
                if (apiName) return;
                if (y.includes(x)) apiName = y;
            })
        })
        
        const link = `https://api.genshin.dev/characters/${apiName}`;
        const res = await fetch(link);
        const json = await res.json();
        return json;
    }

    async GetAllCharacters(): Promise<void> {
        this.characterState = false;
        interface RolesJSO { [index: string]: { roles: Record<string, unknown> } }
        // deno-lint-ignore prefer-const
        let characters: Record<string, unknown> = {};
        eval(
            "characters " +
            (await (await (await fetch(
                "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/build.js",
            )).text()).replace("export const builds", "")),
        );

        await this.fetchApiNames();
        const charactersNames = Object.keys(characters);

        const characterData : Character[] =  await Promise.all(charactersNames.map(async characterName => {
            const roleNames = Object.keys((<RolesJSO>characters)[characterName].roles);
            const editedRoles = roleNames.map(roleName => {
                const role = <CharacterBuild>(<RolesJSO>characters)[characterName].roles[roleName];
                role.type = roleName;
                return role
            })


            const capitalizedCharacterName = deserialize(characterName);

            const visionName = (await this.fetchCharData(characterName))["vision"]

            return { name: capitalizedCharacterName, vision: <Vision>Vision.getVision(visionName), roles: <[CharacterBuild]>editedRoles };
        }));

        this.characters = <[Character]>characterData;
        this.characterState = true;
    }

    getNearestCharacter(input: string): [string] {
        const nameMap = this.characters?.map(
          (x) => {
            return {
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
      
        return <[string]>nearests?.map((x) => x.name).sort();
      }
      

    getChars = () => {
        return this.characters;
    }

    isChar = (id: string) : boolean => {
        return this.characters?.some(x=>x.name===this.getNameFromId(id)) || false;
    }

    getNameFromId = (id : string) : string => {
        return id.split("_").map(w=>w.charAt(0).toUpperCase() + w.substr(1)).join(" ");
    }

    getCharacterData = (char : string)=> {
        return <Character>this.characters?.find(x=>x.name === char);
    }

    getCharacterBuilds = (char : string)=>{
        return <[CharacterBuild]>this.getCharacterData(char).roles
    }

}   


const characterBuilds = new CharactersBuilds();

export { characterBuilds, Vision }