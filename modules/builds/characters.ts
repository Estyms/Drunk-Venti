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
    async GetAllCharacters(): Promise<[Character]> {
        // deno-lint-ignore prefer-const
        let characters: Record<string, unknown> = {};
        eval(
            "characters " +
            (await (await (await fetch(
                "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/build.js",
            )).text()).replace("export const builds", "")),
        );


        const charactersName = Object.keys(characters as Record<string, unknown>);

        const characterData = charactersName.map(x => {
            const roleNames = Object.keys((characters as unknown as { [index: string]: { roles: Record<string, unknown> } })[x].roles);
            const editedRoles = roleNames.map(y => {
                const z = (characters as unknown as { [index: string]: { roles: Record<string, unknown> } })[x].roles[y] as unknown as CharacterBuild;
                z.type = y;
                return z
            })

            return { name: x, roles: editedRoles };
        })

        return characterData as unknown as [Character];
    }
}


const characterBuilds = new CharactersBuilds();


async function testtt() {
    const data = await characterBuilds.GetAllCharacters();
    console.log(JSON.stringify(data))
}

testtt();


export { characterBuilds }