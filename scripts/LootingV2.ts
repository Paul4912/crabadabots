import { config as dotEnvConfig } from "dotenv"
dotEnvConfig()
import { ethers } from "hardhat"
import axios from "axios"
import {
    TeamData,
    TavernData,
    LootingData,
    MineData,
    MineDetailData
} from "./models/data"
import {
    getTeamsUrl,
    tavernUrlBigLimit,
    lootingUrl,
    getActiveGamesUrl,
    getMineDetail,
} from './CrabadaApi';
import {Faction} from './models/enums'
import TimeHelper from "./utils/timeHelper"
import { isOurTeamStronger } from "./services/gameService"
import Logger, { LogAction } from './utils/logger';
import LootingContractv2 from "./contractWrappers/LootingContractv2"

//ADD TEAM_IDS WHICH YOU WANT TO LOOT
const LOOTING_TEAMS: number[] = [];

async function main() {
    const [myWallet, ...accounts] = await ethers.getSigners()
    const walletAddress = process.env.ADDRESS ? process.env.ADDRESS : ''

    const contract = new LootingContractv2(myWallet);
    
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

                let mineDetailData: MineDetailData = (await axios.get(getMineDetail(mine.game_id))).data.result;
                
                if(contract.shouldReinforce(mineDetailData, lastTimestamp)) { // Team requires reinforcing
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
                    await contract.closeGame(mine);
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

                        if(!lootingData[0]?.game_id){
                            continue;
                        }

                        const frontRunGameId = lootingData[0].game_id + 2;
                        let gameNotFoundRetry = 0;
                        while(true) {
                            try {
                                await contract.startGame(frontRunGameId, team.team_id);
                                looted = true
                                break
                            } catch(error: any) {
                                // console.log(error);
                                if(error.error.toString().includes('GAME:LOOTED')){
                                    Logger.Log(LogAction.Error, `Game looted already - ${frontRunGameId}`);
                                    break;
                                } else if(error.error.toString().includes('GAME:INVALID GAME ID')){
                                    Logger.Log(LogAction.Error, `Game not found - ${frontRunGameId} - try ${gameNotFoundRetry}`);
                                    gameNotFoundRetry++
                                    if(gameNotFoundRetry > 10) {
                                        break;
                                    }
                                } else {
                                    throw error;
                                }
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
