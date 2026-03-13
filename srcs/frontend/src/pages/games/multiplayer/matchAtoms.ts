// src/pages/games/multiplayer/matchAtoms.ts
import { atom } from "jotai";

export const matchIdAtom = atom<string | null>(null);
export const playerNameAtom = atom<string>("");
export const isCreatorAtom = atom<boolean>(false);