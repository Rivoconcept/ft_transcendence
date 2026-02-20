// /home/rhanitra/GITHUB/transcendence/ft_transcendence/srcs/frontend/src/context/CardContext.tsx

import { createContext, useContext, useState } from "react";
import { CARDS } from "../typescript/CardContextType";
import type { CardContextType } from "../typescript/CardContextType";
import { drawnCardsAtom } from "../state/CardGameAtoms";
import { useSetAtom } from "jotai";


const CardContext = createContext<CardContextType | null>(null);

export function CardContextProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<CardContextType["cards"]>(null);
  const setDrawnCards = useSetAtom(drawnCardsAtom);

  const drawAll = () => {
    const allCardsRandomOrder = [...CARDS].sort(() => Math.random() - 0.5);
    const drawn = allCardsRandomOrder.slice(0, 3).map(c => ({
      id: c.id,
      value: c.value,
    }));

    setCards(drawn);
    setDrawnCards(drawn);
  };

  const reset = () => {
    setCards(null);
    setDrawnCards(null);
  };

  return (
    <CardContext.Provider value={{ cards, drawAll, reset }}>
      {children}
    </CardContext.Provider>
  );
}


/* ---------- CUSTOM HOOK ---------- */

export function useCardState() {
  const ctx = useContext(CardContext);
  if (!ctx) {
    throw new Error("useCardState must be used within CardContextProvider");
  }
  return ctx;
}
