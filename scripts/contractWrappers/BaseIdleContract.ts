import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat"
import { CrabadaGame, CrabadaGame__factory } from "../../typechain";
import { MineData, MineDetailData, TavernData } from "../models/data";
import CrabWallet from "../CrabWallet";
import { GameAction } from "../models/enums";
import NotificationService from "../services/notificationService";
import TimeHelper from '../utils/timeHelper';
import Logger, { LogAction } from '../utils/logger';
import timeHelper from "../utils/timeHelper";
import { BigNumber } from "ethers";

abstract class BaseIdleContract {

  protected abstract close(gameId: number): Promise<void>;
  protected abstract reinforce(gameId: number, reinforceCrab: TavernData): Promise<void>;
  protected abstract start(gameId:number, teamId: number): Promise<void>;

  public abstract shouldReinforce<T extends MineData | MineDetailData>(mine: T, lastTimestamp: number): boolean;
  public abstract shouldClose(mine: MineData, lastTimestamp: number): boolean;

  public abstract contractType: GameAction;
  
  protected crabWallet: CrabWallet;
  protected contract: CrabadaGame;
  
  constructor(wallet: SignerWithAddress) { 
    this.contract = new ethers.Contract("0x82a85407BD612f52577909F4A58bfC6873f14DA8", CrabadaGame__factory.abi).connect(wallet) as CrabadaGame;
    this.crabWallet = new CrabWallet(wallet);
  }

  public async startGame(gameId:number, teamId: number) {
    Logger.Log(LogAction.Info, `Attempting to start game with team - ${teamId}`)
    await TimeHelper.apiTimeout(this.start(gameId, teamId), 300000)
    Logger.Log(LogAction.Success,`Started game with team - ${teamId}`)
  }

  public async closeGame(mine: MineData) {
      Logger.Log(LogAction.Info, `Attempting to close game - ${mine.game_id}`)
      
      await TimeHelper.apiTimeout(this.close(mine.game_id), 300000);

      if(NotificationService.on) {
          const balanceText = await this.crabWallet.getStringBalance()
          await NotificationService.send(`${this.contractType}: Success ${mine.team_id}\n\n` + balanceText)
      }

      Logger.Log(LogAction.Success, `Closed game - ${mine.game_id}`);
  }

  public async reinforceTeam(mine: MineData, reinforceCrab: TavernData) {
    Logger.Log(LogAction.Info, `Attempting to reinforce team ${this.contractType === GameAction.Loot ? mine.attack_team_id : mine.team_id}`)

    await TimeHelper.apiTimeout(this.reinforce(mine.game_id, reinforceCrab), 300000);

    Logger.Log(LogAction.Success, `Reinforced with crab id ${reinforceCrab.crabada_id}. BP: ${reinforceCrab.battle_point} MP: ${reinforceCrab.mine_point} Price: ${ethers.utils.formatEther(BigNumber.from(reinforceCrab.price.toString()))}.`)
  }

  public async getRequiredTip() {
    let feeData = await this.crabWallet.crabWallet.getFeeData()
    let tip = feeData.maxPriorityFeePerGas ?? BigNumber.from(2.5*1e9)
    return {maxFeePerGas: BigNumber.from(150*1e9), maxPriorityFeePerGas: tip}
  }
}

export default BaseIdleContract;