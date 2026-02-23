// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "jotai";

import MainMenu from "./mainMenu";

import './styles/main.scss';

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Provider>
			<MainMenu />
		</Provider>
	</React.StrictMode>
);
