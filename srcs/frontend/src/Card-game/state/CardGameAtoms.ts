import { atom } from "jotai";
import { proofByNine } from "../utils/proofByNine";
import type { DrawnCard } from "../typescript/CardContextType";

/**
 * Atom qui contient les cartes tirées
 * (on ne remplace pas encore le CardContext)
 */
export const drawnCardsAtom = atom<DrawnCard[] | null>(null);

/**
 * Atom dérivé : calcule le score automatiquement
 */
export const scoreAtom = atom<number | null>((get) => {
  const cards = get(drawnCardsAtom);
  if (!cards || cards.length !== 3) return null;

  const sum = cards.reduce((s, c) => s + c.value, 0);
  return proofByNine(sum);
});

/**
 * Atom pour le statut de victoire
 */
export const isWinAtom = atom<boolean>(false);

/**
 * Atom pour l'ID utilisateur
 */
export const userIdAtom = atom<string | null>(null);

/**
 * Atom combiné pour les résultats du jeu
 */
export const cardGameResultAtom = atom(
  (get) => ({
    score: get(scoreAtom),
    is_win: get(isWinAtom),
    user_id: get(userIdAtom),
  })
);
