// src/pages/games/cardGame/cardScenes/CardGameDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { socketStore } from "../../../../websocket";

interface Player {
  id: number;
  name: string;
  ready?: boolean;
  score: number;
}

interface CardGameDashboardProps {
  phase: Phase;
  setPhase: (phase: Phase) => void;
}

export default function CardGameDashboard({ phase, setPhase }: CardGameDashboardProps) {
  const { score, reset } = useCardState();
  const { playTurn, isWin, isLose, turn, isFinished, timeLeft } = useCardGameState();

  const [scores, setScores] = useState<number[]>([]);
  const [hasFinalScore, setHasFinalScore] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  const [, setFinalScore] = useAtom(FinalScore);
  const [, setPlayerState] = useAtom(PlayerState);

  const mode = useAtomValue(gameModeAtom);
  const navigate = useNavigate();
  const location = useLocation();
  const matchId = location.state?.matchId;
  const initialPlayers = location.state?.players ?? [];

  if (!mode) throw new Error("Game started without a selected mode");

  // -----------------------------
  // Initialise joueurs depuis lobby
  // -----------------------------
  useEffect(() => {
    if (!initialPlayers || initialPlayers.length === 0) return;

    const initPlayers = initialPlayers.map((p: any) => ({
      id: p.id,
      name: p.name,
      score: p.score ?? 0,
    }));

    setPlayers(prev => {
      const same = prev.length === initPlayers.length &&
        prev.every((v, i) => v.id === initPlayers[i].id && v.score === initPlayers[i].score);
      return same ? prev : initPlayers;
    });
  }, [initialPlayers]);

  // -----------------------------
  // Gestion bouton
  // -----------------------------
  const onButtonClick = () => {
    if (phase === Phase.BEGIN) setPhase(Phase.SHUFFLE);
    else if (phase === Phase.SHUFFLE) {
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
  // Ajouter score à chaque round et sync multi
  // -----------------------------
  useEffect(() => {
    if (score === null) return;

    setScores(prev => {
      if (prev[prev.length - 1] === score) return prev; // évite boucle infinie
      return [...prev, score];
    });

    // Met à jour le score du joueur courant (premier joueur pour simplification)
    setPlayers(prev => prev.map((p, i) => (i === 0 ? { ...p, score } : p)));

    // Envoi score au serveur pour MULTI
    if (mode === "MULTI" && socketStore.isConnected() && matchId) {
      socketStore.emit("match:submit-score", { matchId, score });
    }
  }, [score, mode, matchId]);

  // -----------------------------
  // Sync Jotai
  // -----------------------------
  const totalScoreCalculated = scores.reduce((sum, s) => sum + s, 0);

  useEffect(() => {
    setFinalScore(totalScoreCalculated);
  }, [totalScoreCalculated, setFinalScore]);

  useEffect(() => {
    setPlayerState(isWin);
  }, [isWin, setPlayerState]);

  // -----------------------------
  // Fin automatique du jeu
  // -----------------------------
  useEffect(() => {
    const isTurnLimitReached = scores.length >= 5;
    if (timeLeft <= 0 || totalScoreCalculated >= 27 || isTurnLimitReached) {
      setPhase(Phase.SHOW_RESULT);
    }
  }, [timeLeft, totalScoreCalculated, scores.length, setPhase]);

  const isGameOverForPush = timeLeft <= 0 || totalScoreCalculated >= 27 || scores.length >= 5;

  // -----------------------------
  // Détermination du gagnant pour multi
  // -----------------------------
  const winnerId = players.length
    ? players.reduce((max, p) => (p.score > (players.find(pl => pl.id === max)?.score ?? 0) ? p.id : max), players[0].id)
    : undefined;

  // -----------------------------
  // UI
  // -----------------------------
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
            <div className="circleTimer"><ProgressCircleTimer /></div>
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
              {scores.map((s, i) => <ScoreList key={i} score={s} round={i + 1} />)}
            </ul>
            <div className="separatorLine" />
            <div className="totalScore"><p>Score <span>{totalScoreCalculated}</span></p></div>
          </div>
        </div>

        <div className="card border-0 bg-black text-light">
          <div className="card-body">
            {isWin && <><h2 className="win">🎉</h2><h3 className="win">You Win!</h3></>}
            {isLose && !isWin && <><span className="lose">💀</span><span className="lose">You lose!</span></>}
          </div>
        </div>
      </div>

      <div className="separatorBottom"><hr className="separator"/></div>
      <div className="cardButton"><PhaseButton phase={phase} onClick={onButtonClick} /></div>

      <CardGameDb
        finalScore={totalScoreCalculated}
        isWin={isWin}
        mode={mode}
        matchId={matchId}
        players={players}
        winnerId={winnerId}
        isGameOver={isGameOverForPush && !hasFinalScore}
        onSaved={() => setHasFinalScore(true)}
      />
    </div>
  );
}