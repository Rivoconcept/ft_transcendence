// src/state/gameResultAtom.ts
import { atom } from "jotai";
import type { GameResult } from "../typescript/cardGameResult";

export const gameResultAtom = atom<GameResult | null>(null);
