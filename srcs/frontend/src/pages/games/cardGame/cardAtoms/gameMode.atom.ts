import { atom } from "jotai";

export type GameMode = "SINGLE" | "MULTI";

export const gameModeAtom = atom<GameMode | null>(null);