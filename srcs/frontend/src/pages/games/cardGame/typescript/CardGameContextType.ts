// /home/rhanitra/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/typescript/CardGameContextType.ts

export interface PlayerScore {
  id: number;
  name: string;
  scores: number[];
  totalScore: number;
  isWin?: boolean;
}

export type CardGameContextType = {
  turn: number;
  maxTurns: number;
  totalScore: number;
  progress: number;
  timeLeft: number;
  maxTime: number;
  playTurn: () => void;
  resetGame: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  addTime: (sec: number) => void;
  isWin: boolean;
  isLose: boolean;
  isFinished: boolean;
  players: PlayerScore[];
  addPlayerScore: (playerId: number, score: number) => void;
};
