
import { Workbox } from '../lib/workbox/workbox-window.prod.mjs';

// We already have translations for these strings:
// "Update %1 before proceeding?"
// "Could not update client."
// "&Update"
// "Update"
// "&Update %1"
// "Update %1"
// "Paint"

if ('serviceWorker' in navigator) {
	const wb = new Workbox('/sw.js');

	const showSkipWaitingPrompt = async (event) => {
		wb.addEventListener('controlling', () => {
			if (window.are_you_sure) {
				are_you_sure(() => {
					window.location.reload();
				});
			} else {
				window.location.reload();
			}
		});

		const updateAccepted = await promptForUpdate();

		if (updateAccepted) {
			wb.messageSkipWaiting();
		}
	};

	wb.addEventListener('waiting', (event) => {
		showSkipWaitingPrompt(event);
	});

	wb.register();
}

async function promptForUpdate() {
	if (!window.showMessageBox) {
		// On about.html, there's no showMessageBox.
		// I might include it later for better integration with the jspaint embed though.
		// At any rate, it should be fairly harmless to skip the prompt on this page...
		// excepppppt for the fact that there's a jspaint embed.
		// @TODO
		return true;
	}
	const { promise, $window } = showMessageBox({
		title: localize("Update %1", localize("Paint")),
		message: localize("Update %1 before proceeding?", localize("Paint")),
		buttons: [
			{ label: localize("Update"), value: "update", default: true },
			{ label: localize("Cancel"), value: "cancel" },
		],
		iconID: "info",
	});
	return await promise === "update";
}
