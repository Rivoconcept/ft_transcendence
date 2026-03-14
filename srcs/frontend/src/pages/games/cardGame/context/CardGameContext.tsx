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
  const isFinished = mode === "SINGLE" ? isWin || isLose : false;

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
  }, [isTimerRunning]); // ❌ plus de timeLeft ici

  /* ================= GAMEPLAY ================= */
  const playTurn = () => {
    if (turn >= MAX_TURNS || timeLeft <= 0) return;
    drawAll();
    setTurn(t => t + 1);
  };

  /* ================= AUTO SCORE ================= */
  useEffect(() => {
    if (cardScore !== null) setTotalScore(prev => prev + cardScore);
  }, [cardScore]);

  useEffect(() => {
    if (isFinished) setIsTimerRunning(false);
  }, [isFinished]);

  /* ================= RESET ================= */
  const resetGame = () => {
    setIsTimerRunning(false); // stop timer
    setTurn(0);
    setTotalScore(0);
    setTimeLeft(TIME_LIMIT);
    resetCards();
    // relance le timer après le reset
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