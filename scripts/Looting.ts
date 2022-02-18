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
    getActiveGamesUrl,
    Faction
} from "./CrabadaApi"
import NotificationService from "./NotificationService"
import CrabWallet from "./CrabWallet"

//ADD TEAM_IDS WHICH YOU WANT TO LOOT
const LOOTING_TEAMS: number[] = [];

async function main() {
    const [myWallet, ...accounts] = await ethers.getSigners()
    const gameAddress = "0x82a85407BD612f52577909F4A58bfC6873f14DA8"
    const walletAddress = process.env.ADDRESS ? process.env.ADDRESS : ''
    const gameContract = new ethers.Contract(gameAddress, CrabadaGame__factory.abi).connect(myWallet) as CrabadaGame

    const crabWallet = new CrabWallet(myWallet);

    let teamData: TeamData[] = []
    let tavernData: TavernData[] = []
    let lootingData: LootingData[] = []
    let activesGamesData: ActiveGamesData[] = []
    let tavernPriceLimit = BigInt(30000000000000000000) // 35 tus. 18 decimals

    while(true) {
        try
        {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const lastTimestamp = blockBefore.timestamp;
            await axios.get(getActiveGamesUrl(walletAddress))
            .then(response => {
                activesGamesData = response.data.result.data.filter((t:ActiveGamesData) => LOOTING_TEAMS.includes(t.attack_team_id))
            })

            for(let i=0; i<activesGamesData.length; i++) {
                let game = activesGamesData[i]

                if(game.round == 1 || game.round == 3) { // Team requires reinforcing
                    await axios.get(tavernUrlBigLimit)
                    .then(response => {
                        tavernData = response.data.result.data
                    })

                    for(let i=0; i<tavernData.length; i++) {
                        const toRentCrab = tavernData[i];
                        //we hiring only pure bulks here to ensure victory
                        if(toRentCrab.battle_point == 237 && toRentCrab.price < tavernPriceLimit) { 
                            console.log("attempting to reinforce")
                            const reinforceTrans = await gameContract.reinforceAttack(game.game_id, toRentCrab.crabada_id, toRentCrab.price.toString())
                            await reinforceTrans.wait()
                            console.log(`Reinforced with crab id ${toRentCrab.crabada_id}. BP: ${toRentCrab.battle_point} MP: ${toRentCrab.mine_point} Price: ${toRentCrab.price}.`)
                        }
                    }
                }

                //Game is done
                const lastTransactionTime = game.process[game.process.length - 1].transaction_time;
                const toClose = (game.round === 0 || game.round === 2 || game.round === 4) //our turn
                    && lastTimestamp > lastTransactionTime + 3660 //we can claim in 61mins if opponent hasn't made a move

                if(toClose) {
                    console.log("game done, settling")
                    const closingTrans = await gameContract.settleGame(game.game_id)
                    await closingTrans.wait()

                    if(NotificationService.on) {
                        const balanceText = await crabWallet.getStringBalance()
                        await NotificationService.send(`Looting successful for team ${game.attack_team_id}\n\n` + balanceText)
                    }

                    console.log("Settled")
                }
            }

            await axios.get(getTeamsUrl(walletAddress))
            .then(response => {
                teamData = response.data.result.data.filter((t: TeamData) => LOOTING_TEAMS.includes(t.team_id));
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

                        //We going back of the list to front to avoid other bots
                        for(let i=lootingData.length - 1; i>=0; i--) {
                            if(shouldLoot(team, lootingData[i])) {
                                console.log('attacking');
                                const lootingTrans = await gameContract.attack(lootingData[i].game_id, team.team_id)
                                await lootingTrans.wait()
                                console.log('attacked!')
                                looted = true
                                break
                            }
                        }
                    }
                    
                    console.log("looting successful for team: " + team.team_id)
                }
            }

            console.log("things seem all gucci, waiting 1 minute before checking if actions required")
            await sleep(60000); // sleep the remainder add a buffer of 60 seconds
        }
        catch(exception: any)
        {
            console.log("error while looting trying again in 1 minute")
            console.log(exception.error)
            // await sleep(30000); // sleep 60 seconds.
            continue // any errors try again
        }
    }
}

function shouldLoot(ourTeam: TeamData, theirTeam: LootingData) {

    //Kevin's logic to my lux > ore with minimum miners revenge
    if(ourTeam.faction === Faction.Lux) {
        return theirTeam.faction === Faction.Ore;
    } 
      

    let adjustedDefensePoints = theirTeam.defense_point;
    let adjustedBattlePoints = ourTeam.battle_point;

    //apply factional advantage
    const factionalAdvantageMatrix: any = {
        [Faction.Ore]: [Faction.Trench, Faction.Abyss],
        [Faction.Abyss]: [Faction.Machine, Faction.Trench],
        [Faction.Faerie]: [Faction.Abyss, Faction.Ore],
        [Faction.Lux]: [Faction.Ore, Faction.Faerie],
        [Faction.Trench]: [Faction.Lux, Faction.Machine],
        [Faction.Machine]: [Faction.Faerie, Faction.Lux],
    }

    //discount enemy defense points if applicable
    if(theirTeam.faction === Faction.None) {
        adjustedDefensePoints = adjustedDefensePoints*.97;
    } else if(factionalAdvantageMatrix[ourTeam.faction].includes(theirTeam.faction)) {
        adjustedDefensePoints = adjustedDefensePoints*.93;
    }

    //discount our battle points if applicable
    if(ourTeam.faction === Faction.None) {
        adjustedBattlePoints = adjustedBattlePoints*.97;
    }else if(factionalAdvantageMatrix[theirTeam.faction].includes(ourTeam.faction)) {
        adjustedBattlePoints = adjustedBattlePoints*.93;
    }

    return adjustedBattlePoints > adjustedDefensePoints;    
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
