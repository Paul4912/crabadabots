import { ethers } from "hardhat"
import axios from "axios"
import {
    CrabadaMining,
    CrabadaMining__factory
} from "../typechain"


async function main() {
    const mineAddress = "0x82a85407BD612f52577909F4A58bfC6873f14DA8"
    const miningContract = new ethers.Contract(mineAddress, CrabadaMining__factory.abi) as CrabadaMining

    const miningTrans = await miningContract.startGame('729')
    miningTrans.wait()

    console.log("YPO")
    await axios.get('https://idle-api.crabada.com/public/idle/mines?user_address=0x4f99949cc732f6c19ca58bd4fc750380bc51b76c&page=1&status=open&limit=8')
        .then(response => {
            console.log("YPO")
            console.log(response.data.result);
        })
        .catch(error => {
            console.log(error);
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
