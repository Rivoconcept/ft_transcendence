// /home/rivoinfo/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/cardAtoms/gameMode.atom.ts

import { atom } from "jotai";

export type GameMode = "SINGLE" | "MULTI";

export const gameModeAtom = atom<GameMode | null>(null);