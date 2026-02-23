import { useCardGameState } from "../context/CardGameContext";



export function ProgressBar() {
  const { progress } = useCardGameState();


  return (
    <div className="progressBarContainer">
      <div
        className="progressBarFill"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
