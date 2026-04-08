// /src/components/PhaseButton.tsx
import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { Phase } from "../typescript/cardPhase";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";
import { useCardGameState } from "../context/CardGameContext";

type Props = {
  phase: Phase;
  onClick: () => void; // navigation /result ou passer à la phase suivante
};

export default function PhaseButton({ phase, onClick }: Props) {
  const mode = useAtomValue(gameModeAtom);
  const { turn, maxTurns, timeLeft } = useCardGameState();

  // --------------------- AUTO-PLAY pour la phase PLAY ---------------------
  useEffect(() => {
    if (phase === Phase.PLAY) {
      // Pour SINGLE : on attend maxTurns
      // Pour MULTI : on attend maxTurns ou timeLeft <= 0
      if ((mode === "SINGLE" && turn < maxTurns) ||
          (mode === "MULTI" && turn < maxTurns && timeLeft > 0)) {
        const timer = setTimeout(() => {
          onClick(); // passe automatiquement à BEGIN ou SHOW_RESULT
        }, 500); // délai pour simuler le joueur
        return () => clearTimeout(timer);
      }
    }
  }, [phase, turn, maxTurns, mode, timeLeft, onClick]);

  // --------------------- PHASE BEGIN ---------------------
  if (phase === Phase.BEGIN) {
    return (
      <button onClick={onClick} className="button1">
        Shuffle
        <svg fill="currentColor" viewBox="0 0 24 24" className="icon">
          <path
            clipRule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
            fillRule="evenodd"
          />
        </svg>
      </button>
    );
  }

  // --------------------- PHASE SHUFFLE ---------------------
  if (phase === Phase.SHUFFLE) {
    return (
      <button onClick={onClick} className="button2">
        <div className="svg-wrapper-1">
          <div className="svg-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                fill="currentColor"
                d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
              />
            </svg>
          </div>
        </div>
        <span>PLAY</span>
      </button>
    );
  }

  // --------------------- PHASE PLAY ---------------------
  if (phase === Phase.PLAY) {
    return <div className="waiting-message">🎮 Playing...</div>;
  }

  // --------------------- PHASE SHOW_RESULT ---------------------
  if (phase === Phase.SHOW_RESULT) {
    if (mode === "MULTI") {
      return <div className="waiting-message">⏳ Preparing results...</div>;
    }

    // Pour SINGLE, afficher bouton "View State"
    return (
      <button
        className="btn btn-success"
        onClick={onClick}
      >
        View State
      </button>
    );
  }

  return null;
}