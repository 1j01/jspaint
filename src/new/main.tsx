import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Initialize i18next for internationalization
import "../react/i18n/i18n";

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
