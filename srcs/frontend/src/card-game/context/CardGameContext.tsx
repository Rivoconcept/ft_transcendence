import { createContext, useContext, useEffect, useState } from "react";
import { useCardState } from "./CardContext";
import type { CardGameContextType } from "../../typescript/CardGameContextType";

const GameContext = createContext<CardGameContextType | null>(null);

const MAX_TURNS = 5;
const MAX_SCORE = 27;
const TIME_LIMIT = 30;

export function CardGameContextProvider({ children }: { children: React.ReactNode }) {
  const { drawAll, score, reset: resetCards } = useCardState();

  const [turn, setTurn] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  /* ================= TIMER GAME LOOP ================= */
  useEffect(() => {
    if (!isTimerRunning) return;
    if (timeLeft <= 0) {
      setIsTimerRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  /* ================= GAMEPLAY ================= */

  const playTurn = () => {
    if (turn >= MAX_TURNS || timeLeft <= 0) return;
    drawAll();
    setTurn(t => t + 1);
    setIsTimerRunning(true); // démarre le timer au premier tour
  };

  useEffect(() => {
    if (score !== null) setTotalScore(s => s + score);
  }, [score]);

  const progress = Math.min((totalScore / MAX_SCORE) * 100, 100);
  const isWin = progress >= 100 && timeLeft > 0;
  const isLose = timeLeft <= 0 || turn >= MAX_TURNS;

  useEffect(() => {
    if (isWin || isLose) setIsTimerRunning(false);
  }, [isWin, isLose]);

  const resetGame = () => {
    setTurn(0);
    setTotalScore(0);
    setTimeLeft(TIME_LIMIT);
    setIsTimerRunning(false);
    resetCards();
  };

  return (
    <GameContext.Provider
      value={{
        turn,
        maxTurns: MAX_TURNS,
        totalScore,
        progress,
        timeLeft,
        maxTime: TIME_LIMIT,
        playTurn,
        resetGame,
        isWin,
        isLose,
        pauseTimer: () => setIsTimerRunning(false),
        resumeTimer: () => setIsTimerRunning(true),
        addTime: (sec: number) => setTimeLeft(t => Math.min(t + sec, TIME_LIMIT)),
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useCardGameState() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useCardGameState must be used within CardGameContextProvider");
  return ctx;
}
