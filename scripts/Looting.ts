import { config as dotEnvConfig } from "dotenv"
dotEnvConfig()
import { ethers } from "hardhat"
import axios from "axios"
import {
    CrabadaGame,
    CrabadaGame__factory
} from "../typechain"
import {
    TeamData,
    TavernData,
    LootingData,
    ActiveGamesData,
    getTeamsUrl,
    tavernUrlBigLimit,
    lootingUrl,
    getActiveGamesUrl
} from "./CrabadaApi"


async function main() {
    const [myWallet, ...accounts] = await ethers.getSigners()
    const gameAddress = "0x82a85407BD612f52577909F4A58bfC6873f14DA8"
    const walletAddress = process.env.ADDRESS ? process.env.ADDRESS : ''
    const gameContract = new ethers.Contract(gameAddress, CrabadaGame__factory.abi).connect(myWallet) as CrabadaGame

    let teamData: TeamData[] = []
    let tavernData: TavernData[] = []
    let lootingData: LootingData[] = []
    let activesGamesData: ActiveGamesData[] = []
    let tavernPriceLimit = BigInt(35000000000000000000) // 35 tus. 18 decimals

    while(true) {
        try
        {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const lastTimestamp = blockBefore.timestamp;

            await axios.get(getActiveGamesUrl(walletAddress))
            .then(response => {
                activesGamesData = response.data.result.data
            })

            for(let i=0; i<activesGamesData.length; i++) {
                let game = activesGamesData[i]

                if(game.round == 1 || game.round == 3) { // Team requires reinforcing
                    await axios.get(tavernUrlBigLimit)
                    .then(response => {
                        tavernData = response.data.result.data
                    })

                    for(let i=0; i<tavernData.length; i++) {
                        if(game.attack_point + tavernData[i].battle_point > game.defence_point && tavernData[i].price < tavernPriceLimit) { 
                            console.log("attempting to reinforce")
                            const reinforceTrans = await gameContract.reinforceDefense(game.game_id, tavernData[i].crabada_id, tavernData[i].price.toString())
                            await reinforceTrans.wait()
                            console.log("reinforce successful")
                        }
                    }
                }
            }

            await axios.get(getTeamsUrl(walletAddress))
            .then(response => {
                teamData = response.data.result.data
            })

            for(let i=0; i<teamData.length; i++) {
                let team = teamData[i]

                if(team.status == "AVAILABLE") { // Team is doing jack shit, go loot some fuckers
                    console.log("searching for a team to loot for team: " + team.team_id)

                    let looted = false;
                    while(!looted) {
                        await axios.get(lootingUrl)
                        .then(response => {
                            lootingData = response.data.result.data
                        })

                        for(let i=0; i<lootingData.length; i++) {
                            if(team.battle_point > lootingData[i].defense_point) {
                                const lootingTrans = await gameContract.attack(lootingData[i].game_id, team.team_id)
                                await lootingTrans.wait()
                                looted = true
                                break
                            }
                        }

                        await sleep(1000); // sleep 0.1 seconds. Then refresh mines and look for loot again.
                    }
                    
                    console.log("looting successful for team: " + team.team_id)
                } else if(team.game_end_time && lastTimestamp > team.game_end_time) { // Game is done and needs to be closed
                    console.log("game done, closing")
                    const closingTrans = await gameContract.closeGame(team.game_id) // MIGHT BE DIFFERENT FOR LOOTING TEST THIS
                    await closingTrans.wait()
                    console.log("closed")
                }
            }

            console.log("things seem all gucci, waiting 1 minute before checking if actions required")
            await sleep(60000); // sleep the remainder add a buffer of 60 seconds
        }
        catch(exception)
        {
            console.log(exception)
            console.log("error while mining trying again in 1 minute")
            await sleep(60000); // sleep 60 seconds.
            continue // any errors try again
        }
    }
}

function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
