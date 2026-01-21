// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/components/cards/ShuffleCard.tsx

import { useLoader } from "@react-three/fiber";
import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { CARDS } from "../../typescript/CardContextType";

export default function ShuffleCard() {
  const group = useRef<THREE.Group>(null!);

  // textures
const fronts = CARDS.map(c =>
  useLoader(THREE.TextureLoader, c.texture)
);

const back = useLoader(THREE.TextureLoader, "/diamonds/back.png");

  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(true);

  // shuffle timer
  useEffect(() => {
    const timer = setInterval(() => {
      setShowBack(prev => {
        if (!prev) setIndex(i => (i + 1) % fronts.length);
        return !prev;
      });
    }, 80);

    return () => clearInterval(timer);
  }, [fronts.length]);

  return (
    <group ref={group}>
      {/* Fond noir derrière la carte */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.5, 3.5]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Carte qui flippe */}
      <mesh>
        <planeGeometry args={[2.5, 3.5]} />
        <meshStandardMaterial
          map={showBack ? back : fronts[index]}
          side={THREE.DoubleSide}
          transparent={true} // utile si les textures ont des zones transparentes
        />
      </mesh>
    </group>
  );
}
