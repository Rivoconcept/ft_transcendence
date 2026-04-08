// /home/rhanitra/Music/ft_transcendence/srcs/frontend/src/pages/games/cardGame/cardAtoms/cardAtoms.tsx
import { atom } from "jotai";
import { Phase } from "../typescript/cardPhase";

export const TIME_LIMIT = 15;

export const FinalScore = atom(0);

export const PlayerState = atom(false);

export const timeLeftAtom = atom(TIME_LIMIT);

export const phaseAtom = atom<Phase>(Phase.BEGIN);