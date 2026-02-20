// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/cardScenes/CardScene.tsx

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import ShuffleCard from "../components/cards/ShuffleCard";
import RevealCard from "../components/cards/RevealCard";
import BackCard from "./CardBack";
import { useCardState } from "../cardGamecontext/CardContext";
import CardGameDashboard from "./CardGameDashboard";



type Phase = "BEGIN" | "SHUFFLE" | "PLAY";

export default function CardScene() {
  const [phase, setPhase] = useState<Phase>("BEGIN");
  const { cards } = useCardState();


  return (
    <>
      {/* CARDS */}
      <div className="cardScene">
        <div className="cardsRow">
          {[0, 1, 2].map(i => (
            <div key={i} className="cardSlot">
              <Canvas camera={{ position: [0, 1.5, 5] }} className="cardCanvas">
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 5, 5]} />
                {phase === "BEGIN" && <BackCard />}
                {phase === "SHUFFLE" && <ShuffleCard />}
                {phase === "PLAY" && cards?.[i] && (
                  <RevealCard key={`reveal-${cards[i].id}`} cardId={cards[i].id} />
                )}
              </Canvas>
            </div>
          ))}
            
          <CardGameDashboard phase={phase} setPhase={setPhase} />
        </div>
      </div>

    </>
  );

}
