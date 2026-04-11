import { createContext, useContext, useEffect, useState } from "react";
import { useCardState } from "./CardContext";
import type { CardGameContextType, Player } from "../typescript/CardGameContextType";
import { TIME_LIMIT, timeLeftAtom } from "../cardAtoms/cardAtoms";
import { useAtom, useAtomValue } from "jotai";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";
import { socketStore } from "../../../../websocket";
import { useParams } from "react-router-dom";


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
  const { roomId: matchId } = useParams();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const isWin =
    mode === "SINGLE"
      ? totalScore >= MAX_SCORE && turn <= MAX_TURNS
      : false;

  const isLose =
    mode === "SINGLE"
      ? totalScore < MAX_SCORE && (timeLeft <= 0 || turn >= MAX_TURNS)
      : false;

  const isFinished =
    mode === "SINGLE"
      ? isWin || isLose || turn >= MAX_TURNS
      : timeLeft <= 0;

  /* ================= TIMER STOP ================= */
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsTimerRunning(false);
    }
  }, [timeLeft]);


    /* ================= MULTI SOCKET START ================= */
    useEffect(() => {
      if (mode !== "MULTI") return;

      const handleStart = ({ startTime }: { startTime: number }) => {
        setStartTime(startTime);
        setIsTimerRunning(true);
      };

      socketStore.on("match:started", handleStart);

      return () => {
        socketStore.off("match:started", handleStart);
      };
    }, [mode]);

    useEffect(() => {
      if (mode !== "MULTI") return;

      const socket = socketStore.getSocket();
      if (!socket || !matchId) return;

      socket.emit("match:get-timer", { matchId });

      const handleSync = ({ startTime }: { startTime: number }) => {
        setStartTime(startTime);
        setIsTimerRunning(true);
      };

      socket.on("match:timer-sync", handleSync);

      return () => {
        socket.off("match:timer-sync", handleSync);
      };
    }, [mode, matchId]);

  /* ================= PLAYERS ================= */
    useEffect(() => {
      const handlePlayers = (data: any) => {
        if (!data.participants) return;

        setPlayers(data.participants);
      };

      socketStore.on("match:player-joined", handlePlayers);

      return () => {
        socketStore.off("match:player-joined", handlePlayers);
      };
    }, []);


    useEffect(() => {
      const handleLeft = (data: any) => {
        if (!data.userId) return;

        setPlayers(prev => prev.filter(p => p.id !== data.userId));
      };

      socketStore.on("match:player-left", handleLeft);

      return () => {
        socketStore.off("match:player-left", handleLeft);
      };
    }, []);

  useEffect(() => {
    if (mode !== "MULTI") return;
    if (startTime === null) return;

    setIsTimerRunning(true);
  }, [startTime, mode]);

  /* ================= TIMER LOOP ================= */
    useEffect(() => {
      if (!isTimerRunning) return;

      // ================= SINGLE =================
      if (mode === "SINGLE") {
        const interval = setInterval(() => {
          setTimeLeft((t) => {
            const next = Math.max(0, t - 1);

            if (next <= 0) setIsTimerRunning(false);

            return next;
          });
        }, 1000);

        return () => clearInterval(interval);
      }

      // ================= MULTI =================
      if (mode === "MULTI") {
        if (startTime === null) return;

        const interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, TIME_LIMIT - elapsed);

          setTimeLeft(remaining);

          if (remaining <= 0) {
            setIsTimerRunning(false);
          }
        }, 250);

        return () => clearInterval(interval);
      }
    }, [isTimerRunning, startTime, mode]);

  /* ================= SINGLE RESET ================= */
  const resetGame = () => {
    setIsTimerRunning(false);
    setTurn(0);
    setTotalScore(0);
    setTimeLeft(TIME_LIMIT);
    resetCards();

    if (mode === "MULTI") return;

    const now = Date.now();
    setStartTime(now);

    setTimeout(() => setIsTimerRunning(true), 0);
  };

  /* ================= GAMEPLAY ================= */
  const playTurn = () => {
    if (isFinished || turn >= MAX_TURNS) return;
    drawAll();
    setTimeout(() => setTurn((t) => t + 1), 0);
  };

  /* ================= SCORE ================= */
  useEffect(() => {
    if (cardScore !== null) {
      setTotalScore((prev) => prev + cardScore);
    }
  }, [cardScore]);

  useEffect(() => {
    if (isFinished) setIsTimerRunning(false);
  }, [isFinished]);

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
          if (timeLeft <= 0) return;

          if (mode === "MULTI") {
            setIsTimerRunning(true);
            return;
          }

          const newStart =
            Date.now() - (TIME_LIMIT - timeLeft) * 1000;

          setStartTime(newStart);
          setIsTimerRunning(true);
        },

        addTime: (sec: number) =>
          setTimeLeft((t) => Math.min(t + sec, TIME_LIMIT)),

        players,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useCardGameState() {
  const ctx = useContext(GameContext);
  if (!ctx)
    throw new Error("useCardGameState must be used within CardGameContextProvider");
  return ctx;
}