import { useCardGameState } from "../../cardGamecontext/CardGameContext";

type Props = {
  size?: number;
  strokeWidth?: number;
};

export default function ProgressCircleTimer({ size = 100, strokeWidth = 10 }: Props) {
  const { timeLeft, maxTime } = useCardGameState();

  // ✅ Limiter la taille si écran > 1360px
  const screenWidth = window.innerWidth;
  const maxSize = 100; // la taille max qu'on veut
  const finalSize = screenWidth > 1360 ? maxSize : size;
  const finalStrokeWidth = strokeWidth; // on peut aussi le limiter si besoin

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / maxTime;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg viewBox="0 0 100 100" width={`${finalSize}px`} height={`${finalSize}px`}>
      <circle
        stroke="#222"
        fill="transparent"
        strokeWidth={finalStrokeWidth}
        r={radius}
        cx={50}
        cy={50}
      />
      <circle
        stroke={timeLeft > maxTime * 0.5 ? "#06f762" : timeLeft > maxTime * 0.25 ? "#ffb703" : "#ff3b3b"}
        fill="transparent"
        strokeWidth={finalStrokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        r={radius}
        cx={50}
        cy={50}
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={20}
        fill="#fceb05"
        fontWeight="bold"
      >
        {timeLeft}s
      </text>
    </svg>
  );
}
