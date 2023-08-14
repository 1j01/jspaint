
import { Workbox } from '../lib/workbox/workbox-window.prod.mjs';

if ('serviceWorker' in navigator) {
	const wb = new Workbox('/sw.js');

	wb.register();
}
