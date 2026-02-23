import CardScene from "./cardScenes/CardScene";
import { CardContextProvider } from "./context/CardContext";
import { CardGameContextProvider } from "./context/CardGameContext";

export default function CardGamePage() {
  return (
    <CardContextProvider>
      <CardGameContextProvider>
        <CardScene />
      </CardGameContextProvider>
    </CardContextProvider>
  );
}