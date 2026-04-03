import { useCardGameState } from "../context/CardGameContext";
import { useEffect, useState } from "react";

type Props = {
  strokeWidth?: number;
};

export default function ProgressCircleTimer({ strokeWidth = 10 }: Props) {
  const { timeLeft, maxTime } = useCardGameState();

  const [size, setSize] = useState({ width: 100, height: 100 });

const updateSize = () => {
  const screenWidth = window.innerWidth;
  let width: number;
  let height: number = 100;

  if (screenWidth < 620) {
    width = 47;
  } else if (screenWidth > 920) {
    width = 100;
  } else {
    const factor = (screenWidth - 620) / (920 - 620);
    width = 47 + factor * (100 - 47);
  }

  setSize({ width, height });
};

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / maxTime;
  const strokeDashoffset = circumference * (1 - progress);

  return (
      <svg
        viewBox="0 0 100 100"
        width={size.width}
        height={size.height}
        style={{ minWidth: 47, maxWidth: 100 }}
      >
      <circle
        stroke="#222"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={50}
        cy={50}
      />
      <circle
        stroke={
          timeLeft > maxTime * 0.5
            ? "#06f762"
            : timeLeft > maxTime * 0.25
            ? "#ffb703"
            : "#ff3b3b"
        }
        fill="transparent"
        strokeWidth={strokeWidth}
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