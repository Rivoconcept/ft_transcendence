import { atom } from 'jotai';

export type GameType = 'tsabo9' | 'number';

export interface GameHistoryEntry {
  id: number;
  gameType: GameType;
  user: string;
  result: 'win' | 'loss';
  opponent: string;
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
];

const generateGameHistory = (): GameHistoryEntry[] => {
  const results: GameHistoryEntry[] = [];
  const now = Date.now();

  for (let i = 1; i <= 50; i++) {
    const gameType: GameType = Math.random() < 0.5 ? 'tsabo9' : 'number';
    const result: 'win' | 'loss' = Math.random() < 0.6 ? 'win' : 'loss';
    const daysAgo = Math.floor(Math.random() * 120);
    const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;
    const opponent = opponentNames[Math.floor(Math.random() * opponentNames.length)];

    results.push({
      id: i,
      gameType,
      user: 'YourUsername',
      result,
      opponent,
      timestamp,
    });
  }

  return results;
};

export const gameHistoryAtom = atom<GameHistoryEntry[]>(generateGameHistory());
