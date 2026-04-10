import { atom } from "jotai";

export type GameMode = "SINGLE" | "MULTI";

export const gameModeAtom = atom<GameMode | null>(null);

export const playerScoresAtom = atom<Record<number, number[]>>({});