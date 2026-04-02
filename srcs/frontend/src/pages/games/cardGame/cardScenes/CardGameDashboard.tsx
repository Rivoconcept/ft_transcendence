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
import AvatarUtil from "../../../../components/AvatarUtil";
import { currentUserAtom } from "../../../../providers";

interface CardGameDashboardProps {
  phase: Phase;
  setPhase: (phase: Phase) => void;
}

export default function CardGameDashboard({ phase, setPhase }: CardGameDashboardProps) {
  const currentUser = useAtomValue(currentUserAtom);

  const { score, reset } = useCardState();
  const { playTurn, resetGame, isWin, isLose, turn, isFinished, timeLeft } = useCardGameState();

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

  if (!mode) throw new Error("Game started without a selected mode");

  /* ------------------ RESET COMPLET ------------------ */
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
  
  /* ------------------ BOUTON ------------------ */
  const onButtonClick = () => {
  if (phase === Phase.BEGIN) {
    setPhase(Phase.SHUFFLE);
  } else if (phase === Phase.SHUFFLE) {
    playTurn();
    setPhase(Phase.PLAY);
  } else if (phase === Phase.PLAY) {
    if (!isFinished) {
      reset();
      setPhase(Phase.BEGIN);
    } else {
      handleNewGame();
    }
  } else if (phase === Phase.SHOW_RESULT) {
    handleNewGame();
    if (mode === "SINGLE") {
      navigate("/games/cardGame/result");
    } else {
      navigate(`/games/cardGame/${roomId}/result`);
    }
  }
};

  /* ------------------ SCORE ROUND ------------------ */
  useEffect(() => {
    if (score !== null) setScores(prev => [...prev, score]);
  }, [score]);

  const totalScoreCalculated = scores.reduce((sum, s) => sum + s, 0);

  /* ------------------ SYNC JOTAI ------------------ */
  useEffect(() => {
    setFinalScore(totalScoreCalculated);

    if (mode === "SINGLE") {
      setPlayerState(isWin);
    }
  }, [totalScoreCalculated, isWin, mode, setFinalScore, setPlayerState]);

  /* ------------------ FIN AUTOMATIQUE ------------------ */
  useEffect(() => {
    const isTurnLimitReached = scores.length >= 5;

    if (timeLeft <= 0 || totalScoreCalculated >= 27 || isTurnLimitReached) {
      setPhase(Phase.SHOW_RESULT);
    }
  }, [timeLeft, totalScoreCalculated, scores.length, setPhase]);

  /* ------------------ FINISH MATCH (Multiplayer) ------------------ */
  useEffect(() => {
    console.log("finishMatch check:", { isCreator, mode, roomId, timeLeft, hasCalled: hasCalledFinishMatchRef.current });
    
    if (!isCreator || mode !== "MULTI" || !roomId || hasCalledFinishMatchRef.current) return;

    if (timeLeft <= 0) {
      console.log("Calling finishMatch for match:", roomId);
      hasCalledFinishMatchRef.current = true;
      const finishMatchAsync = async () => {
        try {
          await apiService.post(`card-games/match/${roomId}/finish`, {});
          console.log("Match finished successfully");
        } catch (error) {
          console.error("Error finishing match:", error);
        }
      };
      void finishMatchAsync();
    }
  }, [timeLeft, isCreator, mode, roomId]);

  /* ------------------ PUSH DB ------------------ */
  const isGameOverForPush =
    timeLeft <= 0 || totalScoreCalculated >= 27 || scores.length >= 5;

  /* ------------------ RELOAD PAGE ------------------ */
  useEffect(() => {
    handleNewGame(); // reset complet si F5
  }, []);

    useEffect(() => {
    if (!socketStore) return;

    const handleResult = (data: { finalScore: number; isWin: boolean; playerName: string }) => {
      console.log("Received result from another player:", data);
      setFinalScore(data.finalScore);
      setPlayerState(data.isWin);
    };

    socketStore.on("match:result", handleResult);

    return () => {
      socketStore.off("match:result", handleResult);
    };
  }, [socketStore, setFinalScore, setPlayerState]);


  return (
    <div className="dashboard">
      <div className="card-group">
        <div className="card border-0 bg-black text-light">
          <div className="card-body">
            <div className="avatar"> 
              <AvatarUtil id={currentUser?.id || 0} radius={120} showStatus={false} />
            </div>
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
        <ProgressBar progress={Math.min((totalScoreCalculated / 27) * 100, 100)} />
      </div>

      <div className="card-group">
        <div className="card border-0 bg-black text-light">
          <ul className="scoreLists">
            {scores.map((s, i) => <ScoreList key={i} score={s} round={i+1} />)}
          </ul>
          <div className="separatorLine" />
          <div className="totalScore">
            <p>Score <span>{totalScoreCalculated}</span></p>
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
        finalScore={totalScoreCalculated}
        isWin={isWin}
        mode={mode}
        matchId={mode === "MULTI" ? roomId : null}
        isGameOver={isGameOverForPush && !hasFinalScore}
        onSaved={() => setHasFinalScore(true)}
      />
    </div>
  );
}
 