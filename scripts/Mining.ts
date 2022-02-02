import { ethers } from "hardhat"
import axios from "axios"
import {
    CrabadaGame,
    CrabadaGame__factory
} from "../typechain"

type teamData = {
    team_id: number,
    game_id: number,
    game_end_time: number,
    game_round: number,
    process_status: string,
    status: string
}

type tavernData = {
    crabada_id: number,
    price: BigInt
}

async function main() {
    const [myWallet, ...accounts] = await ethers.getSigners()
    const gameAddress = "0x82a85407BD612f52577909F4A58bfC6873f14DA8"
    const gameContract = new ethers.Contract(gameAddress, CrabadaGame__factory.abi).connect(myWallet) as CrabadaGame

    let teamData: teamData[] = []
    let tavernData: tavernData[] = []
    let tavernPriceLimit = BigInt(30000000000000000000) // 30 tus. 18 decimals

    while(true) {
        try
        {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const lastTimestamp = blockBefore.timestamp;

            await axios.get('https://idle-api.crabada.com/public/idle/teams?user_address=0x4f99949cc732f6c19ca58bd4fc750380bc51b76c&page=1&limit=10')
            .then(response => {
                teamData = response.data.result.data
            })

            await teamData.forEach(async team => {
                if(team.status == "AVAILABLE") { // Team is doing jack shit, get to work
                    console.log("attempting to mine for team: " + team.team_id)
                    const miningTrans = await gameContract.startGame(team.team_id)
                    miningTrans.wait()
                    console.log("mining successful for team: " + team.team_id)
                } else if((team.game_round == 0 && team.process_status == "attack") || team.game_round == 2) {
                    await axios.get('https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=price&order=asc&page=1&limit=10')
                    .then(response => {
                        tavernData = response.data.result.data
                    })

                    if(tavernData[1].price < tavernPriceLimit) {
                        console.log("attempting to reinforce for team: " + team.team_id)
                        const reinforceTrans = await gameContract.reinforceDefense(team.game_id, tavernData[1].crabada_id, tavernData[1].price.toString())
                        reinforceTrans.wait()
                        console.log("reinforce successful for team: " + team.team_id)
                    }
                } else if(team.process_status == "settle" && team.game_end_time && lastTimestamp > team.game_end_time) {
                    console.log("game done, closing")
                    const closingTrans = await gameContract.closeGame(team.game_id)
                    closingTrans.wait()
                    console.log("closed")
                }
            })

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
