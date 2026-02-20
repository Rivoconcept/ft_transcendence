// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/cardScenes/CardScene.tsx

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import ShuffleCard from "../components/ShuffleCard";
import RevealCard from "../components/RevealCard";
import BackCard from "./CardBack";

import CardGameDashboard from "./CardGameDashboard";
import { Phase } from "../typescript/cardPhase";
import { useCardState } from "../context/CardContext";

export default function CardScene() {
  const [phase, setPhase] = useState<Phase>(Phase.BEGIN);
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
                {phase === Phase.BEGIN && <BackCard />}
                {phase === Phase.SHUFFLE && <ShuffleCard />}
                {phase === Phase.PLAY && cards?.[i] && (
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

