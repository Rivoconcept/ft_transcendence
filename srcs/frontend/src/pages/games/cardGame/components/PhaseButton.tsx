// /src/components/PhaseButton.tsx
import { useAtomValue } from "jotai";
import { Phase } from "../typescript/cardPhase";
import { isCreatorAtom } from "../../multiplayer/matchAtoms";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";
import { timeLeftAtom } from "../cardAtoms/cardAtoms";

type Props = {
  phase: Phase;
  onClick: () => void; // navigation /result
  onPublishResult?: () => void; // pour mode MULTI
};

export default function PhaseButton({ phase, onClick, onPublishResult }: Props) {
  const isCreator = useAtomValue(isCreatorAtom);
  const mode = useAtomValue(gameModeAtom);
  const timeLeft = useAtomValue(timeLeftAtom);

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
    return (
      <button onClick={onClick} className="button3">
        <span>Restart</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 74 74" height="34" width="34">
          <circle strokeWidth="3" stroke="black" r="35.5" cy="37" cx="37" />
          <path
            fill="black"
            d="M25 35.5C24.1716 35.5 23.5 36.1716 23.5 37C23.5 37.8284 24.1716 38.5 25 38.5V35.5ZM49.0607 38.0607C49.6464 37.4749 49.6464 36.5251 49.0607 35.9393L39.5147 26.3934C38.9289 25.8076 37.9792 25.8076 37.3934 26.3934C36.8076 26.9792 36.8076 27.9289 37.3934 28.5147L45.8787 37L37.3934 45.4853C36.8076 46.0711 36.8076 47.0208 37.3934 47.6066C37.9792 48.1924 38.9289 48.1924 39.5147 47.6066L49.0607 38.0607ZM25 38.5L48 38.5V35.5L25 35.5V38.5Z"
          />
        </svg>
      </button>
    );
  }

  // --------------------- PHASE SHOW_RESULT ---------------------
  if (phase === Phase.SHOW_RESULT) {
    // En mode MULTI, les joueurs non créateurs voient attente
    if (timeLeft > 0 && mode === "MULTI" && !isCreator) {
      return <div className="waiting-message">⏳ Waiting for the result...</div>;
    }

    // Créateur (MULTI) ou SINGLE → bouton View State
    return (
      <button
        className="btn btn-success"
        onClick={() => {
          if (onPublishResult) onPublishResult(); // publie via socket en mode MULTI
          onClick(); // navigation vers /result
        }}
      >
        View State
      </button>
    );
  }

  return null;
}
