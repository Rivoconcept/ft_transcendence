// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "jotai";

import './Card-game/styles/main.scss';

import MainMenu from "./mainMenu";
// import { CardContextProvider } from "./Card-game/cardGamecontext/CardContext";
// import { CardGameContextProvider } from "./Card-game/cardGamecontext/CardGameContext";
// import CardScene from "./Card-game/cardScenes/CardScene";



ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Provider>
			<MainMenu />
		</Provider>
      {/* <CardContextProvider>
        <CardGameContextProvider>
          <CardScene />
        </CardGameContextProvider>
      </CardContextProvider> */}
	</React.StrictMode>
);
