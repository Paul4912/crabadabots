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
    getTeamsUrl,
    tavernUrl
} from "./CrabadaApi"


async function main() {
    const [myWallet, ...accounts] = await ethers.getSigners()
    const gameAddress = "0x82a85407BD612f52577909F4A58bfC6873f14DA8"
    const walletAddress = process.env.ADDRESS ? process.env.ADDRESS : ''
    const gameContract = new ethers.Contract(gameAddress, CrabadaGame__factory.abi).connect(myWallet) as CrabadaGame

    let teamData: TeamData[] = []
    let tavernData: TavernData[] = []
    let tavernPriceLimit = BigInt(30000000000000000000) // 30 tus. 18 decimals

    while(true) {
        try
        {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const lastTimestamp = blockBefore.timestamp;

            await axios.get(getTeamsUrl(walletAddress))
            .then(response => {
                teamData = response.data.result.data
            })

            for(let i=0; i<teamData.length; i++) {
                let team = teamData[i]

                if(team.status == "AVAILABLE") { // Team is doing jack shit, get to work
                    console.log("attempting to mine for team: " + team.team_id)
                    const miningTrans = await gameContract.startGame(team.team_id)
                    await miningTrans.wait()
                    console.log("mining successful for team: " + team.team_id)
                } else if((team.game_round == 0 && team.process_status == "attack") || team.game_round == 2) { // Team requires reinforcing
                    await axios.get(tavernUrl)
                    .then(response => {
                        tavernData = response.data.result.data
                    })

                    if(tavernData[1].price < tavernPriceLimit) {
                        console.log("attempting to reinforce for team: " + team.team_id)
                        const reinforceTrans = await gameContract.reinforceDefense(team.game_id, tavernData[1].crabada_id, tavernData[1].price.toString())
                        await reinforceTrans.wait()
                        console.log("reinforce successful for team: " + team.team_id)
                    }
                } else if(team.game_end_time && lastTimestamp > team.game_end_time) { // Game is done and needs to be closed
                    console.log("game done, closing")
                    const closingTrans = await gameContract.closeGame(team.game_id)
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
