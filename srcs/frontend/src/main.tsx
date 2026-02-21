// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "jotai";

import MainMenu from "./mainMenu";

import './styles/main.scss';
// import { CardContextProvider } from "./card-game/context/CardContext";
// import { CardGameContextProvider } from "./card-game/context/CardGameContext";
// import CardScene from "./card-game/cardScenes/CardScene";



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
