// /home/rhanitra/Music/ft_transcendence/srcs/frontend/src/pages/games/cardGame/cardAtoms/cardAtoms.tsx
import { atom } from "jotai";

export const TIME_LIMIT = 30;

export const FinalScore = atom(0);

export const PlayerState = atom(false);

export const timeLeftAtom = atom(TIME_LIMIT);