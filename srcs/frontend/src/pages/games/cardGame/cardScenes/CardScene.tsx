// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/cardScenes/CardScene.tsx
import { Canvas } from "@react-three/fiber";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import ShuffleCard from "../components/ShuffleCard";
import RevealCard from "../components/RevealCard";
import BackCard from "./CardBack";

import CardGameDashboard from "./CardGameDashboard";


import { Phase } from "../typescript/cardPhase";
import { useCardState } from "../context/CardContext";

import { useAtomValue } from "jotai";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";
import { playerNameAtom } from "../../multiplayer/matchAtoms";

import { socketStore } from "../../../../websocket";
import PlayerList from "./PlayerList";

export default function CardScene() {
  const [phase, setPhase] = useState<Phase>(Phase.BEGIN);
  const { cards } = useCardState();

  const mode = useAtomValue(gameModeAtom);
  const playerName = useAtomValue(playerNameAtom);
  const { roomId } = useParams();

  /* ================= SOCKET JOIN (FIX PRINCIPAL) ================= */
    useEffect(() => {
    if (!socketStore || !roomId || !playerName || mode !== "MULTI") return;

    const socket = socketStore.getSocket();
    if (!socket) return;

    const joinRoom = () => {
      console.log("🎮 Joining match room from GAME...");
      socket.emit("joinMatchRoom", {
        matchId: roomId,
        playerName,
      });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [roomId, playerName, mode]);

  return (
    <div className="cardScene d-flex">

      {/* {mode === "MULTI" && (
        <div style={{ width: "250px", marginRight: "1rem" }}>
          <PlayerList />
        </div>
      )} */}


      <div className="flex-grow-1">
        <div className="cardsRow">
          <PlayerList />

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
                {phase === Phase.SHOW_RESULT && <BackCard />}
              </Canvas>
            </div>
          ))}

          <CardGameDashboard phase={phase} setPhase={setPhase} />
        </div>
      </div>
    </div>
  );
}