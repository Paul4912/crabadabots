import { config as dotEnvConfig } from "dotenv"
dotEnvConfig()
import { ethers } from "hardhat"
import axios from "axios"
import {
    TeamData,
    TavernData,
    LootingData,
    MineData
} from "./models/data"
import {
    getTeamsUrl,
    tavernUrlBigLimit,
    lootingUrl,
    getActiveGamesUrl,
} from './CrabadaApi';
import {Faction} from './models/enums'
import LootingContract from "./contractWrappers/LootingContract"
import TimeHelper from "./utils/timeHelper"
import { isOurTeamStronger } from "./services/gameService"
import Logger, { LogAction } from './utils/logger';

//ADD TEAM_IDS WHICH YOU WANT TO LOOT
const LOOTING_TEAMS: number[] = [];

async function main() {
    const [myWallet, ...accounts] = await ethers.getSigners()
    const walletAddress = process.env.ADDRESS ? process.env.ADDRESS : ''

    const contract = new LootingContract(myWallet);
    
    let teamData: TeamData[] = []
    let tavernData: TavernData[] = []
    let lootingData: LootingData[] = []
    let activeMinesData: MineData[] = []
    let tavernPriceLimit = BigInt(30000000000000000000) // 35 tus. 18 decimals

    while(true) {
        try
        {
            const lastTimestamp = await TimeHelper.getBlockTimestamp();

            await axios.get(getActiveGamesUrl(walletAddress))
            .then(response => {
                activeMinesData = response.data.result.data;
                if(LOOTING_TEAMS.length) {
                    activeMinesData = activeMinesData.filter((t:MineData) => LOOTING_TEAMS.includes(t.attack_team_id))
                }
            })

            for(let i=0; i<activeMinesData.length; i++) {
                let mine = activeMinesData[i]

                if(contract.shouldReinforce(mine, lastTimestamp)) { // Team requires reinforcing
                    await axios.get(tavernUrlBigLimit)
                    .then(response => {
                        tavernData = response.data.result.data
                    })

                    for(let i=0; i<tavernData.length; i++) {
                        const toRentCrab = tavernData[i];
                        //we hiring only pure bulks here to ensure victory
                        if(toRentCrab.battle_point == 237 && toRentCrab.price < tavernPriceLimit) { 
                            await contract.reinforceTeam(mine, toRentCrab);
                        }
                    }
                }

                if(contract.shouldClose(mine, lastTimestamp)) {
                    contract.closeGame(mine);
                }
            }

            await axios.get(getTeamsUrl(walletAddress))
            .then(response => {
                teamData = response.data.result.data.filter((t: TeamData) => LOOTING_TEAMS.includes(t.team_id));
            })

            for(let i=0; i<teamData.length; i++) {
                let team = teamData[i]

                if(team.status == "AVAILABLE") { // Team is doing jack shit, go loot some fuckers
                    Logger.Log(LogAction.Info, "Searching for a team to loot for team: " + team.team_id)

                    let looted = false;
                    while(!looted) {
                        await axios.get(lootingUrl)
                        .then(response => {
                            lootingData = response.data.result.data
                        })

                        //We going back of the list to front to avoid other bots
                        for(let i=lootingData.length - 1; i>=0; i--) {
                            if(shouldLoot(team, lootingData[i])) {
                                await contract.startGame(lootingData[i].game_id, team.team_id);    
                                looted = true
                                break
                            }
                        }
                    }
                    
                    Logger.Log(LogAction.Success, "Success for team - " + team.team_id);
                }
            }

            Logger.Log(LogAction.Info, "Gucci...");
            await TimeHelper.sleep(60000); // sleep the remainder add a buffer of 60 seconds
        }
        catch(exception: any)
        {
            Logger.Log(LogAction.Error, exception);
            // await TimeHelper.sleep(30000); // sleep 60 seconds.
            continue // any errors try again
        }
    }
}

function shouldLoot(ourTeam: TeamData, theirTeam: LootingData) {
    //Kevin's logic to my lux > ore with minimum miners revenge
    if(ourTeam.faction === Faction.Lux) {
        return theirTeam.faction === Faction.Ore;
    } 

    return isOurTeamStronger(
        ourTeam.battle_point, 
        ourTeam.faction, 
        theirTeam.defense_point, 
        theirTeam.faction)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
