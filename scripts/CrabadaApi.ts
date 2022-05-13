export const getTeamsUrl = (address: string) =>
  `https://idle-game-api.crabada.com/public/idle/teams?user_address=${address}&page=1&limit=100`;
export const getMinesUrl = (address: string) =>
  `https://idle-game-api.crabada.com/public/idle/mines?user_address=${address}&page=1&status=open&limit=100`;
export const tavernUrl =
  "https://idle-game-api.crabada.com/public/idle/crabadas/lending?orderBy=price&order=asc&page=1&limit=100";
export const tavernUrlBigLimit =
  "https://idle-game-api.crabada.com/public/idle/crabadas/lending?orderBy=price&class_ids[]=4&order=asc&page=1&limit=100";
export const lootingUrl =
  "https://idle-game-api.crabada.com/public/idle/mines?page=1&status=open&looter_address=0x0000000000000000000000000000000000000000&can_loot=1&limit=100";
export const getActiveGamesUrl = (address: string) =>
  `https://idle-game-api.crabada.com/public/idle/mines?looter_address=${address}&page=1&status=open&limit=100`;
export const getMineDetail = (mineId: number) => `https://idle-game-api.crabada.com/public/idle/mine/${mineId}`;

export const configs = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36",
  },
};
