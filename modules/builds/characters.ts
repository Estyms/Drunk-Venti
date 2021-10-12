interface CharacterBuild {
    type: string,
    recommended: boolean,
    weapons: [{id:string}],
    mainStats: [sands:string, goblet: string, circlet:string],
    subStats: [string],
    talents: [string],
    tip: string,
    note: string
}

interface Character {
    name: string
    roles: [CharacterBuild]
}


class CharactersBuilds {

    private characterState = false;
    private characters : [Character] | undefined;

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


        const charactersNames = Object.keys(characters);

        const characterData = charactersNames.map(characterName => {
            const roleNames = Object.keys((<RolesJSO>characters)[characterName].roles);
            const editedRoles = roleNames.map(roleName => {
                const role = <CharacterBuild>(<RolesJSO>characters)[characterName].roles[roleName];
                role.type = roleName;
                return role
            })

            const capitalizedCharacterName = characterName.split("_").map(x=>x.charAt(0).toUpperCase() + x.slice(1)).join(" ")

            return { name: capitalizedCharacterName, roles: editedRoles };
        })

        this.characters = <[Character]>characterData;
        this.characterState = true;
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

    getCharacterBuilds = (char : string)=>{
        return <[CharacterBuild]>this.characters?.find(x=>x.name == char)?.roles
    }

}   


const characterBuilds = new CharactersBuilds();

export { characterBuilds }