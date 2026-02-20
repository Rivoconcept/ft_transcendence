// /home/rivoinfo/Documents/DEV/transcendence/ft_transcendence/srcs/frontend/src/typescript/CardContextType.ts

export type Card = {
  id: string;
  value: number;
  texture: string;
};

export const CARDS: Card[] = [
  { id: "1",  value: 1,  texture: "/diamonds/1.png" },
  { id: "2",  value: 2,  texture: "/diamonds/2.png" },
  { id: "3",  value: 3,  texture: "/diamonds/3.png" },
  { id: "4",  value: 4,  texture: "/diamonds/4.png" },
  { id: "5",  value: 5,  texture: "/diamonds/5.png" },
  { id: "6",  value: 6,  texture: "/diamonds/6.png" },
  { id: "7",  value: 7,  texture: "/diamonds/7.png" },
  { id: "8",  value: 8,  texture: "/diamonds/8.png" },
  { id: "9",  value: 9,  texture: "/diamonds/9.png" },
  { id: "10", value: 10, texture: "/diamonds/10.png" },
  { id: "11", value: 11, texture: "/diamonds/11.png" },
  { id: "12", value: 12, texture: "/diamonds/12.png" },
  { id: "13", value: 13, texture: "/diamonds/13.png" },
];

export type DrawnCard = {
  id: string;
  value: number;
};

export type CardContextType = {
  cards: DrawnCard[] | null;
  drawAll: () => void;
  reset: () => void;
};
