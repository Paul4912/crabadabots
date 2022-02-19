export type TeamData = {
    team_id: number,
    game_id: number,
    battle_point: number,
    game_end_time: number,
    game_round: number,
    process_status: string,
    status: string
}

export type MineData = {
    team_id: number,
    game_id: number,
    battle_point: number,
    end_time: number,
    attack_point: number,
    defense_point: number,
    process: Process[]
}

export type Process = {
    action: string,
    transaction_time: number
}

export type TavernData = {
    crabada_id: number,
    price: bigint,
    battle_point: number,
    mine_point: number
}

export type LootingData = {
    game_id: number,
    defense_point: number,
}

export type ActiveGamesData = {
    game_id: number,
    round: number,
    defence_point: number,
    attack_point: number
}

export const getTeamsUrl = (address: string) => `https://idle-api.crabada.com/public/idle/teams?user_address=${address}&page=1&limit=10`
export const getMinesUrl = (address: string) => `https://idle-api.crabada.com/public/idle/mines?user_address=${address}&page=1&status=open&limit=8`
export const tavernUrl = "https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=price&order=asc&page=1&limit=50"
export const tavernUrlBigLimit = "https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=price&order=asc&page=1&limit=120"
export const lootingUrl = "https://idle-api.crabada.com/public/idle/mines?page=1&status=open&looter_address=0x0000000000000000000000000000000000000000&can_loot=1&limit=8"
export const getActiveGamesUrl = (address: string) => `https://idle-api.crabada.com/public/idle/mines?user_address=${address}&page=1&status=open&limit=8`