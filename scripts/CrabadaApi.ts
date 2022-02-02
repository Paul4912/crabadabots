export type TeamData = {
    team_id: number,
    game_id: number,
    game_end_time: number,
    game_round: number,
    process_status: string,
    status: string
}

export type TavernData = {
    crabada_id: number,
    price: BigInt
}

export const getTeamsUrl = (address: string) => `https://idle-api.crabada.com/public/idle/teams?user_address=${address}&page=1&limit=10`
export const tavernUrl = "https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=price&order=asc&page=1&limit=10"