export interface Player {
  id: number;
  name: string;
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
  players: Player[];
};
