import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import BaseIdleContract from './BaseIdleContract'
import { MineData, MineDetailData, TavernData } from '../models/data';
import { GameAction } from '../models/enums';

class LootingContract extends BaseIdleContract {
  contractType = GameAction.Loot;

  constructor(wallet: SignerWithAddress) {
    super(wallet)
  }

  protected async reinforce(gameId: number, reinforceCrab: TavernData): Promise<void> {
    const reinforceTrans = await this.contract.reinforceAttack(gameId, reinforceCrab.crabada_id, reinforceCrab.price.toString(), await this.getRequiredTip());
    await reinforceTrans.wait();
  }

  protected async start(gameId: number, teamId: number): Promise<void> {
    const lootingTrans = await this.contract.attack(gameId, teamId);
    await lootingTrans.wait();
  }

  protected async close(gameId: number) {
    const closingTrans = await this.contract.settleGame(gameId, await this.getRequiredTip());
    await closingTrans.wait();
  }

  public shouldReinforce<T extends MineData | MineDetailData>(mine: T, lastTimestamp: number): boolean {
    const lootingMine = mine as MineData;
    return lootingMine.process[lootingMine.process.length - 1].action === 'reinforce-defense';
  }

  public shouldClose(mine: MineData, lastTimestamp: number): boolean {
    const lastAction = mine.process[mine.process.length - 1];
    
    // console.log(`Game ${mine.game_id} | last action ${lastAction.action} | settle time left ${lastTimestamp - lastAction.transaction_time - 3660}`)
    const pastOneHour = mine.process[0].transaction_time + 3660;
    return (lastAction.action === 'reinforce-attack' 
      || lastAction.action === 'attack') //our turn
      && lastTimestamp > (lastAction.transaction_time + 1800)
      && lastTimestamp > pastOneHour //we can claim if opponent hasnt made a move in 30mins and 1 hour past create game
  }
}

export default LootingContract;