// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/components/cards/ProgressBarTimer.tsx

import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { useCardGameState } from "../../cardGamecontext/CardGameContext";

export default function ProgressBarTimer() {
  const { timeLeft, maxTime } = useCardGameState();

  // fallback safe
  const duration = maxTime ?? 30;                 // durée totale
  const remainingTime = Math.max(0, Math.min(timeLeft ?? 0, duration));

  // si durée invalide, on ne rend rien
  if (duration <= 0) return null;

  // TS workaround pour colors
  const colors: [string, number][] = [
    ["#4caf50", 0.5],  // vert pour la première moitié
    ["#ffa500", 0.33], // orange
    ["#f44336", 0],    // rouge à la fin
  ];

  return (
    <CountdownCircleTimer
      key={duration}              // force réinitialisation si duration change
      isPlaying={remainingTime > 0}
      duration={duration}
      initialRemainingTime={remainingTime}
      colors={colors as any}      // workaround TS
      onComplete={() => [false, 0]} // stop timer
    >
      {({ remainingTime: rt }) => (
        <div style={{
          fontSize: 18,
          fontWeight: "bold",
          color:
            (rt ?? 0) <= 5 ? "#f44336" :
            (rt ?? 0) <= duration / 2 ? "#ffa500" :
            "#4caf50"
        }}>
          {rt ?? 0}s
        </div>
      )}
    </CountdownCircleTimer>
  );
}
