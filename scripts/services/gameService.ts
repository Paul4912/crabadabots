import { Faction } from "../models/enums";

export function isOurTeamStronger(
      ourTeamPoints: number, 
      ourTeamFaction: Faction, 
      theirTeamPoints: number, 
      theirTeamFaction: Faction) {
      
    let adjustedDefensePoints = theirTeamPoints;
    let adjustedBattlePoints = ourTeamPoints;

    //apply factional advantage
    const factionalAdvantageMatrix: any = {
        [Faction.Ore]: [Faction.Trench, Faction.Abyss],
        [Faction.Abyss]: [Faction.Machine, Faction.Trench],
        [Faction.Faerie]: [Faction.Abyss, Faction.Ore],
        [Faction.Lux]: [Faction.Ore, Faction.Faerie],
        [Faction.Trench]: [Faction.Lux, Faction.Machine],
        [Faction.Machine]: [Faction.Faerie, Faction.Lux],
        [Faction.None]: []
    }
    
    //discount enemy defense points if applicable
    if(theirTeamFaction === Faction.None) {
        adjustedDefensePoints = adjustedDefensePoints*.97;
    } else if(factionalAdvantageMatrix[ourTeamFaction].includes(theirTeamFaction)) {
        adjustedDefensePoints = adjustedDefensePoints*.93;
    }

    //discount our battle points if applicable
    if(ourTeamFaction === Faction.None) {
        adjustedBattlePoints = adjustedBattlePoints*.97;
    }else if(factionalAdvantageMatrix[theirTeamFaction].includes(ourTeamFaction)) {
        adjustedBattlePoints = adjustedBattlePoints*.93;
    }

    return adjustedBattlePoints > adjustedDefensePoints;    
}