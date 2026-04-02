// /home/rhanitra/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/context/CardGameContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { useCardState } from "./CardContext";
import type { CardGameContextType } from "../typescript/CardGameContextType";
import { TIME_LIMIT, timeLeftAtom } from "../cardAtoms/cardAtoms";
import { useAtom, useAtomValue } from "jotai";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";

const GameContext = createContext<CardGameContextType | null>(null);

const MAX_TURNS = 5;
const MAX_SCORE = 27;

export function CardGameContextProvider({ children }: { children: React.ReactNode }) {
  const { drawAll, score: cardScore, reset: resetCards } = useCardState();

  const [turn, setTurn] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useAtom(timeLeftAtom);
  const mode = useAtomValue(gameModeAtom);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsTimerRunning(false);
    }
  }, [timeLeft]);


  const isWin = mode === "SINGLE" ? totalScore >= MAX_SCORE && turn <= MAX_TURNS : false;
  const isLose = mode === "SINGLE" ? totalScore < MAX_SCORE && timeLeft <= 0 : false;
  // For MULTI: game is finished when time runs out. For SINGLE: finished when win/lose condition met OR all 5 turns are done
  const isFinished = mode === "SINGLE" ? (isWin || isLose || turn >= MAX_TURNS) : timeLeft <= 0;

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  /* ================= GAMEPLAY ================= */
  const playTurn = () => {
    if (isFinished || turn >= MAX_TURNS) return;
    drawAll();
    setTimeout(() => setTurn(t => t + 1), 0);
  };

  /* ================= AUTO SCORE ================= */
  useEffect(() => {
    if (cardScore !== null)
    {
        setTotalScore(prev => prev + cardScore);
    }
  }, [cardScore]);

  useEffect(() => {
    if (isFinished) setIsTimerRunning(false);
  }, [isFinished]);

  /* ================= RESET ================= */
  const resetGame = () => {
    setIsTimerRunning(false);
    setTurn(0);
    setTotalScore(0);
    setTimeLeft(TIME_LIMIT);
    resetCards();
    // restart timer after reset
    setTimeout(() => setIsTimerRunning(true), 0);
  };

  const progress = Math.min((totalScore / MAX_SCORE) * 100, 100);

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
        isFinished,
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