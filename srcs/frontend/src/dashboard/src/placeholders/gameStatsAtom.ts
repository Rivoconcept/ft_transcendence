import { atom } from 'jotai';

export type GameType = 'tsabo9' | 'number';

export interface GameResult {
  id: number;
  game: GameType;
  result: 'win' | 'loss';
  timestamp: number;
}

export type StatsFilter = 'overall' | GameType;

const generateGameStats = (): GameResult[] => {
  const results: GameResult[] = [];
  const now = Date.now();

  for (let i = 1; i <= 50; i++) {
    const game: GameType = Math.random() < 0.5 ? 'tsabo9' : 'number';

    const result: 'win' | 'loss' = Math.random() < 0.6 ? 'win' : 'loss';

    const daysAgo = Math.floor(Math.random() * 120);
    const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;

    results.push({
      id: i,
      game,
      result,
      timestamp,
    });
  }

  return results;
};

export const gameStatsAtom = atom<GameResult[]>(generateGameStats());
export const gameStatsFilterAtom = atom<StatsFilter>('overall');