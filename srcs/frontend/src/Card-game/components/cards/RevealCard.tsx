// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/components/cards/RevealCard.tsx

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useRef, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { CARDS } from "../../typescript/CardContextType";

export default function RevealCard({ cardId }: { cardId: string }) {
  const group = useRef<THREE.Group>(null!);
  const { scene } = useThree();

  /* ======================
     GEOMETRY (anti-miroir)
  ====================== */
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(2.5, 3.5);
    const uv = g.attributes.uv.array as Float32Array;

    uv[0] = 1; uv[2] = 0;
    uv[4] = 1; uv[6] = 0;

    g.attributes.uv.needsUpdate = true;
    return g;
  }, []);

  /* ======================
     TEXTURES
  ====================== */
  const fronts = CARDS.map(c =>
    useLoader(THREE.TextureLoader, c.texture)
  );
  const back = useLoader(THREE.TextureLoader, "/diamonds/back.png");

  /* ======================
     STATE
  ====================== */
  const [index, setIndex] = useState<number | null>(null);
  const [showBack, setShowBack] = useState(true);
  const flipped = useRef(false);

  /* ======================
     BACKGROUND
  ====================== */
  useEffect(() => {
    scene.background = new THREE.Color(0x000000);
  }, [scene]);

  /* ======================
     INIT / RESET ON CARD
  ====================== */
  useEffect(() => {
    if (!cardId) return;
    const i = CARDS.findIndex(c => c.id === cardId);
    if (i === -1) return;

    setIndex(i);

    if (!group.current) return;
    group.current.rotation.y = 0;
    setShowBack(true);
    flipped.current = false;
  }, [cardId]);


  /* ======================
     ANIMATION
  ====================== */
  useFrame(() => {
    if (!group.current) return;
    if (index === null) return;

    if (group.current.rotation.y >= Math.PI) return;

    group.current.rotation.y += 0.12;

    if (!flipped.current && group.current.rotation.y >= Math.PI / 2) {
      setShowBack(false);
      flipped.current = true;
    }
  });



  if (index === null) return null; // 👈 évite un render invalide

  /* ======================
     RENDER
  ====================== */
  return (
    <group ref={group}>
      {/* Fond noir */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.5, 3.5]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Carte */}
      <mesh>
        <primitive object={geometry} />
        <meshStandardMaterial
          map={showBack ? back : fronts[index]}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </group>
  );
}
