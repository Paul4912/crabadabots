import { ethers } from "hardhat"
import axios from "axios"
import {
    CrabadaMining,
    CrabadaMining__factory
} from "../typechain"

type mineData = {
    game_id: number,
    end_time: number,
    team_id: number,
    status: string
}

async function main() {
    const [myWallet, ...accounts] = await ethers.getSigners()
    const mineAddress = "0x82a85407BD612f52577909F4A58bfC6873f14DA8"
    const miningContract = new ethers.Contract(mineAddress, CrabadaMining__factory.abi).connect(myWallet) as CrabadaMining

    let mineData: mineData[] = []

    while(true) {
        try
        {
            await axios.get('https://idle-api.crabada.com/public/idle/mines?user_address=0x4f99949cc732f6c19ca58bd4fc750380bc51b76c&page=1&status=open&limit=8')
            .then(response => {
                mineData = response.data.result
            })
        }
        catch(exception)
        {
            continue // any errors try again
        }

        if(mineData.length == 0) { // if nothing mining get to work
            try
            {
                const miningTrans = await miningContract.startGame('729')
                miningTrans.wait()

                await sleep(14460000); // sleep for 4 hours and 1 minutes.
            }
            catch(exception)
            {
                continue // any errors try again
            }
        } else {
            if(mineData[0].status == "closed") { //if game closable, close it
                const closingTrans = await miningContract.closeGame(mineData[0].game_id)
                closingTrans.wait()
            } else { // If somehow not closable yet wait the remaining time
                let remainder = mineData[0].end_time - Date.now()
                await sleep((remainder + 30) * 1000); // sleep the remainder add a buffer of 30 seconds
            }
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
