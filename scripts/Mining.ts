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
    tavernUrl,
    MineData,
    getMinesUrl
} from "./CrabadaApi"
import NotificationService from './NotificationService';
import CrabWallet from "./CrabWallet"

async function main() {
    const [myWallet, ...accounts] = await ethers.getSigners()
    const gameAddress = "0x82a85407BD612f52577909F4A58bfC6873f14DA8"
    const walletAddress = process.env.ADDRESS ? process.env.ADDRESS : ''
    const gameContract = new ethers.Contract(gameAddress, CrabadaGame__factory.abi).connect(myWallet) as CrabadaGame

    const crabWallet = new CrabWallet(myWallet);

    let teamData: TeamData[] = []
    let tavernData: TavernData[] = []
    let minesData: MineData[] = []
    let tavernPriceLimit = BigInt(30000000000000000000) // 30 tus. 18 decimals

    while(true) {
        try
        {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const lastTimestamp = blockBefore.timestamp;

            await axios.get(getMinesUrl(walletAddress))
            .then(response => {
                minesData = response.data.result.data
            })

            for(let i=0; i<minesData.length; i++) {
                
                let mine = minesData[i]
                let latestAction = mine.process[mine.process.length - 1]

                if(mine.end_time && lastTimestamp > mine.end_time) { // Game is done and needs to be closed
                    console.log("game done, closing")
                    const closingTrans = await gameContract.closeGame(mine.game_id)
                    await closingTrans.wait()

                    if(NotificationService.on) {
                        const balanceText = await crabWallet.getStringBalance()
                        await NotificationService.send(`Mined Successful for team ${mine.team_id}\n\n` + balanceText)
                    }

                    console.log("closed")
                }
                
                if((latestAction.action == 'attack' || (latestAction.action == 'reinforce-attack' && mine.process.length == 4)) // when getting attacked
                       && lastTimestamp - latestAction.transaction_time < 60*30 // still within 30 minute reinforce window
                       && mine.attack_point > mine.defense_point) { // attacking team is stronger than defending
                    
                    await axios.get(tavernUrl)
                    .then(response => {
                        tavernData = response.data.result.data
                    })

                    console.log("attempting to reinforce for team: " + mine.team_id)
                    let currentCrab = tavernData[0]

                    for(let i=1; i<tavernData.length; i++) {
                        if(compareReinforce(currentCrab, tavernData[i]) && tavernData[i].price < tavernPriceLimit) {
                            currentCrab = tavernData[i]
                        }
                    }

                    const reinforceTrans = await gameContract.reinforceDefense(mine.game_id, currentCrab.crabada_id, currentCrab.price.toString())
                    await reinforceTrans.wait()
                    console.log(`Reinforced with crab id ${currentCrab.crabada_id}. BP: ${currentCrab.battle_point} MP: ${currentCrab.mine_point} Price: ${currentCrab.price}.`)
                }
            }

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
                }
            }

            console.log("things seem all gucci, waiting 1 minute before checking if actions required " + getCurrentTime())
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

function getCurrentTime(): string {
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date+' '+time;
}

function compareReinforce(currentCrab: TavernData, nextCrab: TavernData): boolean {
    if(nextCrab.mine_point > currentCrab.mine_point) {
        let mpDifference = nextCrab.mine_point - currentCrab.mine_point
        let adjustedMPDifference = ethers.utils.parseEther(mpDifference.toString()).toBigInt()
        let priceDifference = (nextCrab.price - currentCrab.price)

        if(adjustedMPDifference*BigInt(2) > priceDifference) {
            return true
        }
    }

    return false
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
