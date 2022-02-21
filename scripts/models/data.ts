import { Faction } from "./enums"

export type TeamData = {
    team_id: number,
    game_id: number,
    battle_point: number,
    game_end_time: number,
    game_round: number,
    process_status: string,
    status: string,
    faction: Faction,
}

export type MineData = {
    team_id: number,
    game_id: number,
    battle_point: number,
    end_time: number,
    attack_point: number,
    defense_point: number,
    process: Process[],
    attack_team_id: number,
    round: number,
}

export type Process = {
    action: string,
    transaction_time: number
}

export type TavernData = {
    crabada_id: number,
    price: bigint,
    battle_point: number,
    mine_point: number,
    is_being_borrowed: number
}

export type LootingData = {
    game_id: number,
    defense_point: number,
    faction: Faction
}

export type MineDetailData = {
  defense_team_faction: Faction,
  attack_team_faction: Faction,
  game_id: number,
  attack_point: number,
  defense_point: number,
  process: Process[],
}