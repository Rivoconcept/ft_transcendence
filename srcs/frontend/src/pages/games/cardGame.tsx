import CardScene from "../../card-game/cardScenes/CardScene";
import { CardContextProvider } from "../../card-game/context/CardContext";
import { CardGameContextProvider } from "../../card-game/context/CardGameContext";

export default function CardGamePage() {
  return (
    <CardContextProvider>
      <CardGameContextProvider>
        <CardScene />
      </CardGameContextProvider>
    </CardContextProvider>
  );
}