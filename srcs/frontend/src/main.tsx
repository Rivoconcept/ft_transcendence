// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "jotai";

import './Card-game/styles/main.scss';
// import { CardContextProvider } from "./Card-game/context/CardContext";
// import CardScene from "./Card-game/cardScenes/CardScene";

import MainMenu from "./mainMenu";



ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Provider>
			<MainMenu />
		</Provider>
		{/* <CardContextProvider>
			<CardScene />
		</CardContextProvider> */}
	</React.StrictMode>
);
