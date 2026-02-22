import { useAtom } from "jotai";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";


export function GameModeSelector() {
  const [, setMode] = useAtom(gameModeAtom);

  return (
    <div className="game-mode-selector">
      <button onClick={() => setMode("SINGLE")}>
        🧍 Single Player
      </button>
      <button onClick={() => setMode("MULTI")}>
        👥 Multiplayer
      </button>
    </div>
  );
}