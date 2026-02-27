import { atom } from 'jotai';

export type GameType = 'diceGame' | 'kingOfDiamond' | 'cardGame';

export interface GameHistoryEntry {
  id: number;
  gameType: GameType;
  user: string;
  result: 'win' | 'loss';
  opponents: string[];
  isMultiplayer: boolean;
  timestamp: number;
}

const opponentNames = [
  'AlexProGamer',
  'ShadowNinja',
  'PhoenixRise',
  'BlazeFury',
  'EchoStrike',
  'VortexKing',
  'IceQueen',
  'ThunderBolt',
  'SilentAssassin',
  'NovaForce',
  'LunaEclipse',
  'CrimsonBlade',
  'SolsticeWolf',
  'TitanForce',
  'NeonGhost',
];

const generateGameHistory = (): GameHistoryEntry[] => {
  const results: GameHistoryEntry[] = [];
  const now = Date.now();

  for (let i = 1; i <= 50; i++) {
    const gameType: GameType = ['diceGame', 'kingOfDiamond', 'cardGame'][Math.floor(Math.random() * 3)] as GameType;
    const result: 'win' | 'loss' = Math.random() < 0.6 ? 'win' : 'loss';
    const daysAgo = Math.floor(Math.random() * 120);
    const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;
    
    // 30% chance for multiplayer match (3-4 players)
    const isMultiplayer = Math.random() < 0.3;
    const numOpponents = isMultiplayer ? Math.floor(Math.random() * 2) + 3 : 1; // 3-4 for multiplayer, 1 for 1v1
    
    const selectedOpponents = new Set<string>();
    while (selectedOpponents.size < numOpponents) {
      selectedOpponents.add(opponentNames[Math.floor(Math.random() * opponentNames.length)]);
    }
    const opponents = Array.from(selectedOpponents);

    results.push({
      id: i,
      gameType,
      user: 'YourUsername',
      result,
      opponents,
      isMultiplayer,
      timestamp,
    });
  }

  return results;
};

export const gameHistoryAtom = atom<GameHistoryEntry[]>(generateGameHistory());
