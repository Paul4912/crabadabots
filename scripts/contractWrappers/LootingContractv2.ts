import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import BaseIdleContract from './BaseIdleContract'
import { MineData, MineDetailData, TavernData } from '../models/data';
import { GameAction } from '../models/enums';
import { isOurTeamStronger } from '../services/gameService';

class LootingContract extends BaseIdleContract {
  contractType = GameAction.Loot;

  constructor(wallet: SignerWithAddress) {
    super(wallet)
  }

  protected async reinforce(gameId: number, reinforceCrab: TavernData): Promise<void> {
    const reinforceTrans = await this.contract.reinforceAttack(gameId, reinforceCrab.crabada_id, reinforceCrab.price.toString());
    await reinforceTrans.wait();
  }

  protected async start(gameId: number, teamId: number): Promise<void> {
    const lootingTrans = await this.contract.attack(gameId, teamId);
    await lootingTrans.wait();
  }

  protected async close(gameId: number) {
    const closingTrans = await this.contract.settleGame(gameId);
    await closingTrans.wait();
  }

  public shouldReinforce<T extends MineData | MineDetailData>(mineDetail: T, lastTimestamp: number): boolean {
    const lootingMine = mineDetail as MineDetailData;

    const latestAction = lootingMine.process[lootingMine.process.length - 1]

    return latestAction.action === 'reinforce-defense'
        && lastTimestamp - latestAction.transaction_time < 60*30 // still within 30 minute reinforce window
        && !isOurTeamStronger(lootingMine.attack_point, lootingMine.attack_team_faction, lootingMine.defense_point, lootingMine.defense_team_faction);
  }

  public shouldClose(mine: MineData, lastTimestamp: number): boolean {
    const lastAction = mine.process[mine.process.length - 1];
    
    // console.log(`Game ${mine.game_id} | last action ${lastAction.action} | settle time left ${lastTimestamp - lastAction.transaction_time - 3660}`)

    return (lastAction.action === 'reinforce-attack' 
      || lastAction.action === 'attack') //our turn
      && lastTimestamp > (lastAction.transaction_time + 3660) //we can claim in 61mins if opponent hasn't made a move
  }
}

export default LootingContract;