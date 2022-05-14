import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();
import { ethers } from "hardhat";
import axios from "axios";
import { getTeamsUrl, tavernUrl, getMinesUrl, getMineDetail, configs } from "./CrabadaApi";

import { TeamData, TavernData, MineData, MineDetailData } from "./models/data";
import Logger, { LogAction } from "./utils/logger";
import MiningContract from "./contractWrappers/MiningContract";
import TimeHelper from "./utils/timeHelper";

//ADD TEAM_IDS WHICH YOU WANT TO LOOT
const MINING_TEAMS: number[] = [];

async function main() {
  const [myWallet, ...accounts] = await ethers.getSigners();
  const walletAddress = process.env.ADDRESS ? process.env.ADDRESS : "";

  const contract = new MiningContract(myWallet);

  let teamData: TeamData[] = [];
  let tavernData: TavernData[] = [];
  let minesData: MineData[] = [];
  let tavernPriceLimit = BigInt(30000000000000000000); // 30 tus. 18 decimals

  while (true) {
    try {
      const lastTimestamp = await TimeHelper.getBlockTimestamp();

      await axios.get(getMinesUrl(walletAddress), configs).then((response) => {
        minesData = response.data.result.data;
        if (MINING_TEAMS.length) {
          minesData = minesData.filter((t: MineData) => MINING_TEAMS.includes(t.team_id));
        }
      });

      for (let i = 0; i < minesData.length; i++) {
        let mine = minesData[i];

        let mineDetailData: MineDetailData = (await axios.get(getMineDetail(mine.game_id), configs)).data.result;

        if (contract.shouldClose(mine, lastTimestamp)) {
          // Game is done and needs to be closed
          await contract.closeGame(mine);
        }

        if (contract.shouldReinforce(mineDetailData, lastTimestamp)) {
          // attacking team is stronger than defending
          await axios.get(tavernUrl, configs).then((response) => {
            tavernData = response.data.result.data;
          });

          let currentCrab = tavernData[0];

          for (let i = 1; i < tavernData.length; i++) {
            if (compareReinforce(currentCrab, tavernData[i]) && tavernData[i].price < tavernPriceLimit) {
              currentCrab = tavernData[i];
            }
          }
          
          await contract.reinforceTeam(mine, currentCrab);
        }
      }

      await axios.get(getTeamsUrl(walletAddress), configs).then((response) => {
        teamData = response.data.result.data;

        if (MINING_TEAMS.length) {
          teamData = teamData.filter((t: TeamData) => MINING_TEAMS.includes(t.team_id));
        }
      });

      for (let i = 0; i < teamData.length; i++) {
        let team = teamData[i];

        if (team.status == "AVAILABLE") {
          // Team is doing jack shit, get to work
          await contract.startGame(team.game_id, team.team_id);
        }
      }

      Logger.Log(LogAction.Info, "Gucci...");
      await TimeHelper.sleep(60000); // sleep the remainder add a buffer of 60 seconds
    } catch (exception: any) {
      Logger.Log(LogAction.Error, exception);
      Logger.Log(LogAction.Error, "Trying again in 10 seconds");
      await TimeHelper.sleep(10000);
      continue; // any errors try again
    }
  }
}

function compareReinforce(currentCrab: TavernData, nextCrab: TavernData): boolean {
  if (nextCrab.mine_point > currentCrab.mine_point) {
    let mpDifference = nextCrab.mine_point - currentCrab.mine_point;
    let adjustedMPDifference = ethers.utils.parseEther(mpDifference.toString()).toBigInt();
    let priceDifference = nextCrab.price - currentCrab.price;

    if (adjustedMPDifference / BigInt(2) > priceDifference) {
      return true;
    }
  }

  return false;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
