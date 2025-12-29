import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const mountNode = document.getElementById("root");

if (!mountNode) {
	throw new Error("Failed to find root container for React preview");
}

const root = createRoot(mountNode);
root.render(
	<StrictMode>
		<App />
	</StrictMode>,
);
