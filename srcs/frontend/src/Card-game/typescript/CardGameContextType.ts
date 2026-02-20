// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/typescript/CardGameContextType.ts

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
};
