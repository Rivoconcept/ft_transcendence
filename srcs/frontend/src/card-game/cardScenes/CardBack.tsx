// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/cardScenes/CardBack.tsx

import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

export default function BackCard() {
  const texture = useLoader(TextureLoader, "/diamonds/back.png");

  return (
<group>
  {/* Fond noir */}
  <mesh position={[0, 0, -0.01]}>
    <planeGeometry args={[2.5, 3.5]} />
    <meshBasicMaterial color={0x000000} />
  </mesh>

  {/* Carte avec texture */}
  <mesh>
    <planeGeometry args={[2.5, 3.5]} />
    <meshStandardMaterial map={texture} side={THREE.DoubleSide} transparent={true} />
  </mesh>
</group>

  );
}
