export enum Faction {
    None = 'NO_FACTION',
    Ore = 'ORE',
    Lux = 'LUX',
    Faerie = 'FAERIE',
    Trench = 'TRENCH',
    Machine = 'MACHINE',
    Abyss = 'ABYSS',
}

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

export type ActiveGamesData = {
    status: string,
    game_id: number,
    round: number,
    defence_point: number,
    attack_point: number,
    attack_team_id: number,
    end_time: number,
    process: Array<{
        action: string,
        transaction_time: number
    }>
}

export const getTeamsUrl = (address: string) => `https://idle-api.crabada.com/public/idle/teams?user_address=${address}&page=1&limit=10`
export const tavernUrl = "https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=price&order=asc&page=1&limit=50"
export const tavernUrlBigLimit = "https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=price&class_ids[]=4&order=asc&page=1&limit=50"
export const lootingUrl = "https://idle-api.crabada.com/public/idle/mines?page=1&status=open&looter_address=0x0000000000000000000000000000000000000000&can_loot=1&limit=8"
export const getActiveGamesUrl = (address: string) => `https://idle-api.crabada.com/public/idle/mines?looter_address=${address}&page=1&status=open&limit=8`
export const getAllEggs = () => 'https://api.crabada.com/public/crabada/all?limit=10000&page=1&from_breed_count=0&to_breed_count=5&from_legend=0&to_legend=6&from_pure=0&to_pure=6&stage=0&orderBy=created_at&order=desc'