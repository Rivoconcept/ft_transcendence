import { createContext, useContext, useEffect, useState } from "react";
import { useCardState } from "./CardContext";
import type { CardGameContextType, PlayerScore } from "../typescript/CardGameContextType";
import { TIME_LIMIT, timeLeftAtom } from "../cardAtoms/cardAtoms";
import { useAtom, useAtomValue } from "jotai";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";
import { socketStore } from "../../../../websocket";

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
  const [startTime, setStartTime] = useState<number | null>(null);

  const [players, setPlayers] = useState<PlayerScore[]>([]);

  // ------------------- SOCKET PLAYERS -------------------
  useEffect(() => {
    if (!socketStore) return;

    const handlePlayers = (data: { participants: { id: number; name: string }[] }) => {
      setPlayers(data.participants.map(p => ({
        id: p.id,
        name: p.name,
        scores: [],
        totalScore: 0,
      })));
    };

    socketStore.on("match:player-joined", handlePlayers);
    socketStore.on("match:player-left", handlePlayers);

    return () => {
      socketStore.off("match:player-joined", handlePlayers);
      socketStore.off("match:player-left", handlePlayers);
    };
  }, []);

  // ------------------- TIMER -------------------
  useEffect(() => {
    if (!isTimerRunning || startTime === null) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, TIME_LIMIT - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) setIsTimerRunning(false);
    }, 250);

    return () => clearInterval(interval);
  }, [isTimerRunning, startTime]);

  // ------------------- GAMEPLAY -------------------
  const playTurn = () => {
    if (isFinished || turn >= MAX_TURNS) return;
    drawAll();
    setTimeout(() => setTurn(t => t + 1), 0);
  };

  const addPlayerScore = (playerId: number, score: number) => {
    setPlayers(prev =>
      prev.map(p =>
        p.id === playerId
          ? { ...p, scores: [...p.scores, score], totalScore: p.totalScore + score }
          : p
      )
    );
  };

  // ------------------- AUTO SCORE -------------------
  useEffect(() => {
    if (cardScore !== null) {
      // Ici tu dois déterminer l'ID du joueur actuel
      const currentPlayerId = players[0]?.id; // à remplacer par la logique réelle
      if (currentPlayerId) {
        addPlayerScore(currentPlayerId, cardScore);
        setTotalScore(prev => prev + cardScore);
      }
    }
  }, [cardScore]);

    // ------------------- AUTO SCORE -------------------
  useEffect(() => {
    if (!socketStore) return;

    const handleScoreUpdate = (data: { playerId: number; score: number }) => {
      setPlayers(prev =>
        prev.map(p =>
          p.id === data.playerId
            ? { ...p, scores: [...p.scores, data.score], totalScore: p.totalScore + data.score }
            : p
        )
      );
      // totalScore global si tu veux
      setTotalScore(prev => prev + data.score);
    };

    socketStore.on("match:score-updated", handleScoreUpdate);

    return () => {
      socketStore.off("match:score-updated", handleScoreUpdate);
    };
  }, []);

  // ------------------- WIN / LOSE -------------------
  const isWin = mode === "SINGLE" ? totalScore >= MAX_SCORE && turn <= MAX_TURNS : false;
  const isLose = mode === "SINGLE" ? (totalScore < MAX_SCORE && (timeLeft <= 0 || turn >= MAX_TURNS)) : false;
  const isFinished = mode === "SINGLE" ? (isWin || isLose || turn >= MAX_TURNS) : timeLeft <= 0;

  // ------------------- RESET -------------------
  const resetGame = () => {
    setIsTimerRunning(false);
    setTurn(0);
    setTotalScore(0);
    setTimeLeft(TIME_LIMIT);
    resetCards();
    setPlayers(prev => prev.map(p => ({ ...p, scores: [], totalScore: 0 })));

    const now = Date.now();
    setStartTime(now);
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
        resumeTimer: () => {
          if (timeLeft > 0) {
            const newStart = Date.now() - (TIME_LIMIT - timeLeft) * 1000;
            setStartTime(newStart);
            setIsTimerRunning(true);
          }
        },
        addTime: (sec: number) => setTimeLeft(t => Math.min(t + sec, TIME_LIMIT)),
        players,
        addPlayerScore,
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