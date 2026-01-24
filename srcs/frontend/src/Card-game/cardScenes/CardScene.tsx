// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/cardScenes/CardScene.tsx

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import ShuffleCard from "../components/cards/ShuffleCard";
import RevealCard from "../components/cards/RevealCard";
import BackCard from "./CardBack";
import PhaseButton from "../components/ui/PhaseButton";
import { useCardState } from "../context/CardContext";

type Phase = "BEGIN" | "SHUFFLE" | "PLAY";

export default function CardScene() {
  const [phase, setPhase] = useState<Phase>("BEGIN");
  const { cards, score, drawAll, reset } = useCardState();

  const onButtonClick = () => {
    if (phase === "BEGIN") {
      setPhase("SHUFFLE");
    } else if (phase === "SHUFFLE") {
      drawAll();      // 👈 tirage via context
      setPhase("PLAY");
    } else if (phase === "PLAY") {
      reset();
      setPhase("BEGIN");
    }
  };

  return (
    <>
      {/* CARTES */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, height: "50vh" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: "15vw", height: "100%" }}>
            <Canvas camera={{ position: [0, 1.5, 5] }} style={{ background: "#000" }}>
              <ambientLight intensity={0.8} />
              <directionalLight position={[5, 5, 5]} />

              {phase === "BEGIN" && <BackCard />}
              {phase === "SHUFFLE" && <ShuffleCard />}
              {phase === "PLAY" && cards && cards[i] && ( <RevealCard key={`reveal-${cards[i].id}`} cardId={cards[i].id} /> )}
            </Canvas>
          </div>
        ))}
      </div>

      {/* SCORE */}
      {score !== null && (
        <div style={{ textAlign: "center", fontSize: 22, fontWeight: "bold" }}>
          Score : {score}
        </div>
      )}

      {/* BOUTON */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
        <PhaseButton phase={phase} onClick={onButtonClick} />
      </div>
    </>
  );
}
