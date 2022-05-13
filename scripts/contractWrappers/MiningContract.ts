import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import BaseIdleContract from './BaseIdleContract'
import { MineData, MineDetailData, TavernData } from '../models/data';
import { GameAction } from '../models/enums';
import { isOurTeamStronger } from '../services/gameService';

class MiningContract extends BaseIdleContract {
  contractType = GameAction.Mine;

  constructor(wallet: SignerWithAddress) {
    super(wallet)
  }

  protected async reinforce(gameId: number, reinforceCrab: TavernData): Promise<void> {
    const reinforceTrans = await this.contract.reinforceDefense(gameId, reinforceCrab.crabada_id, reinforceCrab.price.toString());
    await reinforceTrans.wait();
  }

  protected async start(gameId: number, teamId: number): Promise<void> {
    const miningTrans = await this.contract.startGame(teamId)
    await miningTrans.wait()
  }

  protected async close(gameId: number) {
    const closingTrans = await this.contract.closeGame(gameId)
    await closingTrans.wait();
  }

  public shouldReinforce<T extends MineData | MineDetailData>(mine: T, lastTimestamp: number): boolean {
    const mineDetail = mine as MineDetailData;

    let latestAction = mineDetail.process[mineDetail.process.length - 1]
    return (latestAction.action == 'attack' || (latestAction.action == 'reinforce-attack' && mineDetail.process.length == 4)) // when getting attacked
      && lastTimestamp - latestAction.transaction_time < 60*30 // still within 30 minute reinforce window
      && lastTimestamp - latestAction.transaction_time > 60*15 // mine after x minutes
      && !isOurTeamStronger(mineDetail.defense_point, mineDetail.defense_team_faction, mineDetail.attack_point, mineDetail.attack_team_faction)
  }

  public shouldClose(mine: MineData, lastTimestamp: number): boolean {
    return Boolean(mine.end_time) && lastTimestamp > mine.end_time;
  }
}

export default MiningContract;