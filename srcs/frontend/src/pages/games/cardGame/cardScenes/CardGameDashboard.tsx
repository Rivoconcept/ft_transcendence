// /home/rivoinfo/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/cardScenes/CardGameDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PhaseButton from "../components/PhaseButton";
import { useCardState } from "../context/CardContext";
import { useCardGameState } from "../context/CardGameContext";
import ProgressCircleTimer from "../components/ProgressCircleTimer";
import { ProgressBar } from "../components/ProgressBarScore";
import ScoreList from "../components/ScoreList";
import { Phase } from "../typescript/cardPhase";
import { useAtom, useAtomValue } from "jotai";
import { FinalScore, PlayerState } from "../cardAtoms/cardAtoms";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";
import CardGameDb from "../components/CardGameDb";
import { playerNameAtom } from "../../multiplayer/matchAtoms";

interface CardGameDashboardProps {
  phase: Phase;
  setPhase: (phase: Phase) => void;
}

export default function CardGameDashboard({ phase, setPhase }: CardGameDashboardProps) {
  const { score, reset } = useCardState();
  const { playTurn, isWin, isLose, turn, isFinished, timeLeft } = useCardGameState();
  const [scores, setScores] = useState<number[]>([]);
  const [hasFinalScore, setHasFinalScore] = useState(false);
  const [, setFinalScore] = useAtom(FinalScore);
  const [, setPlayerState] = useAtom(PlayerState);
  const mode = useAtomValue(gameModeAtom);
  const navigate = useNavigate();
  const playerName = useAtomValue(playerNameAtom);
  const { roomId } = useParams();
  
  if (!mode) throw new Error("Game started without a selected mode");

  // -----------------------------
  // Gestion bouton
  // -----------------------------
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
      }
    } else if (phase === Phase.SHOW_RESULT) {
      navigate("/games/cardGame/result");
    }
  };

  // -----------------------------
  // Ajouter score à chaque round
  // -----------------------------
  useEffect(() => {
    if (score !== null) {
      setScores(prev => [...prev, score]);
    }
  }, [score]);

  const totalScoreCalculated = scores.reduce((sum, s) => sum + s, 0);

  // -----------------------------
  // Sync Jotai
  // -----------------------------
  useEffect(() => {
    setFinalScore(totalScoreCalculated);
    setPlayerState(isWin);
  }, [totalScoreCalculated, isWin, setFinalScore, setPlayerState]);

  // -----------------------------
  // Fin automatique du jeu (après 5 scores ou conditions)
  // -----------------------------
  useEffect(() => {
    const isTurnLimitReached = scores.length >= 5;

    if (
      timeLeft <= 0 ||
      totalScoreCalculated >= 27 ||
      isTurnLimitReached
    ) {
      setPhase(Phase.SHOW_RESULT);
    }
  }, [timeLeft, totalScoreCalculated, scores.length, setPhase]);

  // -----------------------------
  // Détection fin pour push DB (sécurisé)
  // -----------------------------
  const isGameOverForPush =
    timeLeft <= 0 ||
    totalScoreCalculated >= 27 ||
    scores.length >= 5;

  return (
    <div className="dashboard">
      {/* UI inchangée */}
      <div className="card-group">
        <div className="card border-0 bg-black text-light">
          <div className="card-body">
            <div className="avatar">
              <img src="/avatar.png" alt="avatar" />
            </div>
          </div>
        </div>

        <div className="card border-0 bg-black text-light">
          <div className="card-body">
            <div className="circleTimer">
              <ProgressCircleTimer />
            </div>
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
          <div className="card-body">
            <ul className="scoreLists">
              {scores.map((s, i) => (
                <ScoreList key={i} score={s} round={i + 1} />
              ))}
            </ul>
            <div className="separatorLine" />
            <div className="totalScore">
              <p>Score <span>{totalScoreCalculated}</span></p>
            </div>
          </div>
        </div>

        <div className="card border-0 bg-black text-light">
          <div className="card-body">
            {isWin && <><h2 className="win">🎉</h2><h3 className="win">You Win!</h3></>}
            {isLose && !isWin && <><span className="lose">💀</span><span className="lose">You lose!</span></>}
          </div>
        </div>
      </div>

      <div className="separatorBottom">
        <hr className="separator"/>
      </div>

      <div className="cardButton">
        <PhaseButton phase={phase} onClick={onButtonClick} />
      </div>

      {/* Push DB une seule fois */}
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