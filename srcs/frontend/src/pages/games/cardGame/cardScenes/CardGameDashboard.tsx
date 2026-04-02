// /home/rhanitra/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/cardScenes/CardGameDashboard.tsx

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PhaseButton from "../components/PhaseButton";
import { useCardState } from "../context/CardContext";
import { useCardGameState } from "../context/CardGameContext";
import ProgressCircleTimer from "../components/ProgressCircleTimer";
import { ProgressBar } from "../components/ProgressBarScore";
import ScoreList from "../components/ScoreList";
import { Phase } from "../typescript/cardPhase";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FinalScore, PlayerState, TIME_LIMIT, timeLeftAtom } from "../cardAtoms/cardAtoms";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";
import CardGameDb from "../components/CardGameDb";
import { playerNameAtom, isCreatorAtom } from "../../multiplayer/matchAtoms";
import { socketStore } from "../../../../websocket";
import apiService from "../../../../services/api.service";

interface CardGameDashboardProps {
  phase: Phase;
  setPhase: (phase: Phase) => void;
}

export default function CardGameDashboard({ phase, setPhase }: CardGameDashboardProps) {
  const { score, reset } = useCardState();
  const { playTurn, resetGame, isWin, isLose, turn, isFinished, maxTurns } = useCardGameState();

  const [scores, setScores] = useState<number[]>([]);
  const [hasFinalScore, setHasFinalScore] = useState(false);

  const [, setFinalScore] = useAtom(FinalScore);
  const [, setPlayerState] = useAtom(PlayerState);
  const setTimeLeft = useSetAtom(timeLeftAtom);

  const mode = useAtomValue(gameModeAtom);
  const playerName = useAtomValue(playerNameAtom);
  const isCreator = useAtomValue(isCreatorAtom);

  const navigate = useNavigate();
  const { roomId } = useParams();
  const hasCalledFinishMatchRef = useRef(false);
  const { totalScore } = useCardGameState();
  const [finalScoreSnapshot, setFinalScoreSnapshot] = useState<number | null>(null);

  if (!mode) throw new Error("Game started without a selected mode");

  /* ------------------ FULL RESET ------------------ */
  const handleNewGame = () => {
    resetGame();
    reset();
    setScores([]);
    setHasFinalScore(false);
    setFinalScore(0);
    setPlayerState(false);
    setTimeLeft(TIME_LIMIT);
    setPhase(Phase.BEGIN);
  };
  
  /* ------------------ BUTTON HANDLER ------------------ */
  const onButtonClick = () => {
  if (phase === Phase.BEGIN) {
    setPhase(Phase.SHUFFLE);
  } else if (phase === Phase.SHUFFLE) {
    playTurn();
    setPhase(Phase.PLAY);
  } else if (phase === Phase.PLAY) {
    // Only allow cycling back to BEGIN if we haven't reached max turns yet
    if (turn < maxTurns) {
      reset();
      setPhase(Phase.BEGIN);
    }
    // If turn >= maxTurns, let the auto-finish effect handle the transition to SHOW_RESULT
  } else if (phase === Phase.SHOW_RESULT) {
    // Only reset game for SINGLE mode
    if (mode === "SINGLE") {
      handleNewGame();
      navigate("/games/cardGame/result");
    } else {
      // MULTI: don't reset, just navigate (auto-navigate effect handles this)
      navigate(`/games/cardGame/${roomId}/result`);
    }
  }
};

  /* ------------------ SCORE COLLECTION ------------------ */
  useEffect(() => {
    if (score !== null) setScores(prev => [...prev, score]);
  }, [score]);

  /* ------------------ SYNC STATE WITH ATOMS ------------------ */
  useEffect(() => {
    setFinalScore(totalScore);

    if (mode === "SINGLE") {
      setPlayerState(isWin);
    }
  }, [totalScore, isWin, mode, setFinalScore, setPlayerState]);

  /* ------------------ AUTO FINISH - Use isFinished from context ------------------ */
  useEffect(() => {
    if (isFinished) {
      setPhase(Phase.SHOW_RESULT);
    }
  }, [isFinished]);

  /* ------------------ FINISH MATCH (Multiplayer) - Only after POST is saved! ------------------ */
  useEffect(() => {
    // Only call finishMatch AFTER we know scores are saved (hasFinalScore = true)
    if (!isCreator || mode !== "MULTI" || !roomId || !hasFinalScore || hasCalledFinishMatchRef.current) return;

    const finishMatchAsync = async () => {
      try {
        hasCalledFinishMatchRef.current = true;
        await apiService.post(`card-games/match/${roomId}/finish`, {});
      } catch (error) {
        console.error("❌ Error finishing match:", error);
      }
    };

    // Small delay to ensure finishMatch happens
    const timer = setTimeout(() => void finishMatchAsync(), 500);
    return () => clearTimeout(timer);
  }, [hasFinalScore, isCreator, mode, roomId]);

  /* ------------------ RELOAD PAGE ------------------ */
  useEffect(() => {
    handleNewGame(); // FULL RESET si F5
  }, []);

    useEffect(() => {
    if (!socketStore) return;

    const handleResult = (data: { finalScore: number; isWin: boolean; playerName: string }) => {
      setFinalScore(data.finalScore);
      setPlayerState(data.isWin);
    };

    socketStore.on("match:result", handleResult);

    return () => {
      socketStore.off("match:result", handleResult);
    };
  }, [socketStore, setFinalScore, setPlayerState]);

  /* ---------- AUTO NAVIGATE for MULTIPLAYER - After POST and finishMatch ---------- */
  // Both creator and non-creator navigate after hasFinalScore is true
  useEffect(() => {
    if (mode !== "MULTI" || phase !== Phase.SHOW_RESULT || !hasFinalScore) return;

    const navigateAsync = async () => {
      // Small delay to ensure finishMatch completes
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate(`/games/cardGame/${roomId}/result`);
    };

    void navigateAsync();
  }, [isCreator, mode, phase, roomId, navigate, hasFinalScore]);

    /* ------------------ SAVE TO DATABASE - sync with isFinished logic ------------------ */

    useEffect(() => {

      if (finalScoreSnapshot === null && isFinished && totalScore >= 0) {

        const timer = setTimeout(() => {
          setFinalScoreSnapshot(totalScore);

        }, 50);
        return () => clearTimeout(timer);
      }
    }, [isFinished, totalScore, finalScoreSnapshot]);



  return (
    <div className="dashboard">
      <div className="card-group">
        <div className="card border-0 bg-black text-light">
          <div className="card-body">
            <div className="avatar"><img src="/avatar.png" alt="avatar" /></div>
          </div>
        </div>
        <div className="card border-0 bg-black text-light">
          <div className="card-body">
            <ProgressCircleTimer />
          </div>
        </div>
      </div>

      <hr className="separator"/>

      <div className="progressBarScore">
        <div className="progressTile">
          <span className="label">PROGRESS</span>
          <span className="turn">{turn} / 5</span>
        </div>
        <ProgressBar progress={Math.min((totalScore / 27) * 100, 100)} />
      </div>

      <div className="card-group">
        <div className="card border-0 bg-black text-light">
          <ul className="scoreLists">
            {scores.map((s, i) => <ScoreList key={i} score={s} round={i+1} />)}
          </ul>
          <div className="separatorLine" />
          <div className="totalScore">
            <p>Score <span>{totalScore}</span></p>
          </div>
        </div>

        <div className="card border-0 bg-black text-light">
          <div className="card-body">
            {isWin && <h3>🎉 You Win!</h3>}
            {isLose && !isWin && <h3>💀 You Lose!</h3>}
          </div>
        </div>
      </div>

      <div className="cardButton">
        <PhaseButton phase={phase} onClick={onButtonClick}/>
      </div>
      <CardGameDb
        player={playerName}
        finalScore={finalScoreSnapshot ?? 0}
        isWin={isWin}
        mode={mode}
        matchId={mode === "MULTI" ? roomId : null}
        isGameOver={finalScoreSnapshot !== null && !hasFinalScore} // reste ok
        onSaved={() => setHasFinalScore(true)}
      />
    </div>
  );
}
 