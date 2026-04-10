import { atom } from "jotai";
import { Phase } from "../typescript/cardPhase";

export const TIME_LIMIT = 30;

export const FinalScore = atom(0);

export const PlayerState = atom(false);

export const timeLeftAtom = atom(TIME_LIMIT);

export const phaseAtom = atom<Phase>(Phase.BEGIN);