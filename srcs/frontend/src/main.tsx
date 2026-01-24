// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

import './Card-game/styles/main.scss';
import { CardContextProvider } from "./Card-game/context/CardContext";
import CardScene from "./Card-game/cardScenes/CardScene";

import MainMenu from "./mainMenu";



ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<MainMenu />
		{/* <CardContextProvider>
			<CardScene />
		</CardContextProvider> */}
	</React.StrictMode>
);
