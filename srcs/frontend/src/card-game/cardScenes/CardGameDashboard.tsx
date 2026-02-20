// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/cardScenes/CardScene.tsx

import { useEffect, useState } from "react";
import PhaseButton from "../components/PhaseButton";
import { useCardState } from "../context/CardContext";
import { useCardGameState } from "../context/CardGameContext";
// import { ProgressBar } from "../components/cards/ProgressBarScore";
import ProgressCircleTimer from "../components/ProgressCircleTimer";
import { ProgressBar } from "../components/ProgressBarScore";
import ScoreList from "../components/ScoreList";
import { Phase } from "../typescript/cardPhase";

interface CardGameDashboardProps {
  phase: Phase;
  setPhase: (phase: Phase) => void;
}

export default function CardGameDashboard({ phase, setPhase }: CardGameDashboardProps) {
  const { score, reset } = useCardState();
  const { playTurn, isWin, isLose, turn } = useCardGameState();
  const [scores, setScores] = useState<number[]>([]);

  const onButtonClick = () => {
    if (phase === Phase.BEGIN) {
      setPhase(Phase.SHUFFLE);

    } else if (phase === "SHUFFLE") {
      playTurn();      // 👈 IMPORTANT
      setPhase(Phase.PLAY);

    } else if (phase === "PLAY") {
      reset();         // reset cards
      setPhase(Phase.BEGIN);
    }
  };

  useEffect(() => {
    if (score !== null) {
      setScores(prev => [...prev, score]);
    }
  }, [score]);

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
                {isWin && <><h2 className="win">🎉 </h2> <h2 className="win">You Win!</h2></>}
                {isLose && !isWin && <> <span className="lose">💀</span> <span className="lose">You lose!</span></>}
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
