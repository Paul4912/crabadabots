export const getTeamsUrl = (address: string) => `https://idle-api.crabada.com/public/idle/teams?user_address=${address}&page=1&limit=10`
export const getMinesUrl = (address: string) => `https://idle-api.crabada.com/public/idle/mines?user_address=${address}&page=1&status=open&limit=8`
export const tavernUrl = "https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=price&order=asc&page=1&limit=300"
export const tavernUrlBigLimit = "https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=price&class_ids[]=4&order=asc&page=1&limit=50"
export const lootingUrl = "https://idle-api.crabada.com/public/idle/mines?page=1&status=open&looter_address=0x0000000000000000000000000000000000000000&can_loot=1&limit=8"
export const getActiveGamesUrl = (address: string) => `https://idle-api.crabada.com/public/idle/mines?looter_address=${address}&page=1&status=open&limit=8`
export const getMineDetail = (mineId: number) => `https://idle-api.crabada.com/public/idle/mine/${mineId}`