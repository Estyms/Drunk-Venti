import { editDist } from "../utils/stringRelated.ts"

interface ArtifactsType {
    [id: string]: ArtifactType
}

interface ArtifactType {
    id: string,
    name: string,
    setPiece: [number],
    sets: {[id: string]: string},
    bonuses: [string],
    rarity: [number],
    domain: string
}

class ArtifactsData {
    private _artifacts : ArtifactsType = {};
    
    async initArtifacts(){
        const res = await fetch("https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/artifacts/en.json")
        this._artifacts = JSON.parse(await res.text())
    }

    get artifacts(){
        return this._artifacts;
    }

    getArtifact(id: string) : ArtifactType{
        return this._artifacts[id]
    }

    getNearestArtifactName(input: string) {
        const nameMap = Object.values(this.artifacts).map(
          (x) => {
            return {
              artifact: x,
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
    
        return <[ArtifactType]>nearests?.map((x) => x.artifact).sort();
      }
}

const artifactsClass = new ArtifactsData()

export type {ArtifactsType, ArtifactType}
export {artifactsClass}