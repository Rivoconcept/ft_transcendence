import { atom } from "jotai";

export const matchIdAtom = atom<string | null>(null);
export const playerNameAtom = atom<string>("");
export const isCreatorAtom = atom<boolean>(false);
export const canViewResultAtom = atom(false);
export const currentMatchAtom = atom<string | null>(null);