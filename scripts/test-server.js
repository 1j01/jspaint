#!/usr/bin/env node
import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

async function startTestServer() {
	const server = await createServer({
		root,
		server: {
			port: 11822,
			host: 'localhost',
			strictPort: true,
		},
		logLevel: 'info',
	});

	await server.listen();

	const { port } = server.config.server;
	console.log(`Test server ready at http://localhost:${port}/new/`);

	// Signal that the server is ready
	process.on('SIGTERM', async () => {
		await server.close();
		process.exit(0);
	});
}

startTestServer().catch((err) => {
	console.error('Failed to start test server:', err);
	process.exit(1);
});
