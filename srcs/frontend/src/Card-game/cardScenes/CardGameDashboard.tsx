// /home/rhanitra/Documents/DEV/transcendence/ft_transcendence/srcs/frontend/src/cardScenes/CardGameDashboard.tsx

import { useEffect, useState } from "react";
import PhaseButton from "../components/ui/PhaseButton";
import { useCardState } from "../cardGamecontext/CardContext";
import { useCardGameState } from "../cardGamecontext/CardGameContext";
import ProgressCircleTimer from "../components/cards/ProgressCircleTimer";
import { ProgressBar } from "../components/cards/ProgressBarScore";
import ScoreList from "../components/cards/ScoreList";
import ScoresTable from "../components/cards/ScoresTable";
import { useAtomValue, useSetAtom } from "jotai";
import { scoreAtom, isWinAtom, userIdAtom } from "../state/CardGameAtoms";
import { useCardGameSubmit } from "../hooks/useCardGameSubmit";


type Phase = "BEGIN" | "SHUFFLE" | "PLAY";

interface CardGameDashboardProps {
  phase: Phase;
  setPhase: (phase: Phase) => void;
}

export default function CardGameDashboard({ phase, setPhase }: CardGameDashboardProps) {
  const { reset } = useCardState();
  const score = useAtomValue(scoreAtom);
  const userId = useAtomValue(userIdAtom);
  const setIsWin = useSetAtom(isWinAtom);
  const { submitGameResult } = useCardGameSubmit();

  const { playTurn, isWin: isWinFromContext, isLose, turn } = useCardGameState();
  const [scores, setScores] = useState<number[]>([]);
  const [isWins, setIsWins] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinalTable, setShowFinalTable] = useState(false);

  const onButtonClick = () => {
    if (phase === "BEGIN") {
      setPhase("SHUFFLE");

    } else if (phase === "SHUFFLE") {
      playTurn();      // 👈 IMPORTANT
      setPhase("PLAY");

    } else if (phase === "PLAY") {
      // Mettre à jour isWin avant de soumettre
      setIsWin(isWinFromContext);
      reset();         // reset cards
      setPhase("BEGIN");
      
      // Soumettre le résultat au backend
      handleGameEnd();
    }
  };

  const handleGameEnd = async () => {
    if (!userId) {
      console.warn('User ID not set, cannot submit game result');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitGameResult();
      console.log('Game result submitted successfully');
    } catch (error) {
      console.error('Failed to submit game result:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (score !== null) {
      setScores(prev => [...prev, score]);
      setIsWins(prev => [...prev, isWinFromContext ? 1 : 0]);
    }
  }, [score, isWinFromContext]);

  // Afficher le tableau après le 5e tour
  useEffect(() => {
    if (turn === 5 && scores.length === 5) {
      setShowFinalTable(true);
    }
  }, [turn, scores.length]);

  const totalScore = scores.reduce((sum, s) => sum + s, 0);

  return (
    <>
        <div className="dashboard">
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
          {/* PROGRESS BAR */}
          <div className="progressBarScore">
            <div className="progressTile">
              <span className="label">PROGRESS</span>
              <span className="turn">{turn} / 5</span>
            </div>
            <ProgressBar />
          </div>

          {/* SCORES TABLE - Affichée après le 5e tour */}
          {showFinalTable && scores.length === 5 && (
            <div className="final-scores-section">
              <h3 className="final-scores-title">Game Results</h3>
              <ScoresTable scores={scores} wins={isWins} />
            </div>
          )}
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
                  <p>Score <span>{totalScore}</span></p>
                </div>
              </div>
            </div>
            <div className="card border-0 bg-black text-light">

              <div className="card-body">
                {isWinFromContext && <><h2 className="win">🎉 </h2> <h2 className="win">You Win!</h2></>}
                {isLose && !isWinFromContext && <> <span className="lose">💀</span> <span className="lose">You lose!</span></>}
                {isSubmitting && <p className="submitting">Sauvegarde en cours...</p>}
              </div>
            </div>
          </div>
          {/* BUTTON */}
          <div className="separatorBottom">
            <hr className="separator"/>
          </div>
          <div className="cardButton">
            <PhaseButton phase={phase} onClick={onButtonClick} />
          </div>
        </div>
    </>
  );

}
