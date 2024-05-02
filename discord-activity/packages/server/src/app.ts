import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
// import enableWs from 'express-ws';
import path from 'path';
import { fetchAndRetry } from './utils';
dotenv.config({ path: '../../.env' });

const app: Application = express();
const port: number = Number(process.env.PORT) || 1999;

// enableWs(app);

app.use(express.json());

// if (process.env.NODE_ENV === 'production') {
//   const clientBuildPath = path.join(__dirname, '../../client/dist');
//   app.use(express.static(clientBuildPath));
// }
// I'm hacking this to work without Vite, without a build step, and without a client folder / monorepo structure.
// This will include odds and ends like .git and .env files by default, so we need to exclude them with an extra route,
// as .env is a security risk and .git and .history are potentially sensitive as well.
app.use((req, res, next) => {
	// Must be case-insensitive for Windows FS!
	// There are quite possibly ways to bypass this, with URL encoding or similar...
	// TODO: use a clean allowed set of files.
	if (req.path.match(/\.(git|history|env)/i)) {
		res.status(403).send('Forbidden');
		return;
	}
	next();
});
const clientSourcePath = path.join(__dirname, '../../../..');
app.use(express.static(clientSourcePath));

// Fetch token from developer portal and return to the embedded app
app.post('/api/token', async (req: Request, res: Response) => {
	const response = await fetchAndRetry(`https://discord.com/api/oauth2/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: process.env.VITE_CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			grant_type: 'authorization_code',
			code: req.body.code,
		}),
	});

	const { access_token } = (await response.json()) as {
		access_token: string;
	};

	res.send({ access_token });
});

// Simple multiplayer image editing
// TODO: require authentication to access a room associated with a Discord Activity instance

// I'm using edit counts to try to minimize work lost in case of conflicts,
// but I'm not sure it's a better idea than the standard way to handle conflicts with If-Match.
// If-Match would require the client to fetch the latest revision ID before sending the PUT request,
// which would mean losing potentially a long string of edits during a period of dis-connectivity,
// but I'm not sure the edit count is worth the complexity to get it working right,
// especially when I plan to replace the multiplayer system with a more robust one later,
// which would actually be able to RESOLVE conflicts, replaying edits on top of each other.

interface Room {
	imageData: string;
	editCount: number;
	revisionId: string;
}
const rooms: { [key: string]: Room } = {};

// app.post('/api/rooms', (req: Request, res: Response) => {
// 	const roomId = uuid(); // or the room id might be the Discord Activity instance ID
// 	rooms[roomId] = '';
// 	res.send({ roomId });
// });

app.get('/api/rooms/:roomId/data', (req: Request, res: Response) => {
	const { roomId } = req.params;
	res.setHeader('X-Revision-Id', rooms[roomId]?.revisionId || '');
	res.setHeader('X-Edit-Count', rooms[roomId]?.editCount || 0);
	// Hacky If-None-Match parsing for ETag support (although more proper than what the AI suggests!)
	if (req.get('If-None-Match')?.split(',').map((s) => s.trim().replace(/^"|"$/g, '')).includes(rooms[roomId]?.revisionId)) {
		return res.status(304).send();
	}
	res.send(rooms[roomId]);
});

app.put('/api/rooms/:roomId/data', bodyParser.text({ type: '*/*' }), (req: Request, res: Response) => {
	const { roomId } = req.params;
	const image = req.body;
	const room = rooms[roomId];
	if (!room) {
		return res.status(404).send('Room not found');
	}
	const editCount = parseInt(req.get('X-Edit-Count') || '0', 10);
	if (!isFinite(editCount)) {
		return res.status(400).send('Invalid edit count');
	}
	// as the edit count is incremented in the client, we're expecting a greater number, not equal
	if (editCount <= room.editCount) {
		return res.status(409).send('Conflict');
	}
	room.imageData = image;
	room.editCount = editCount; // incremented in client currently
	room.revisionId = req.get('X-Revision-Id') || '';
	res.send({ success: true });
});

// app.ws('/api/sessions/:session_id', (ws, req) => {
// console.log('WebSocket support is enabled')
// @ts-ignore
// app.ws('/api/session', (ws, req) => {
// 	console.log('WebSocket was opened')

// 	ws.on('message', (msg: string) => {
// 		console.log('Received message', msg)
// 		ws.send(msg)
// 	})

// 	ws.on('close', () => {
// 		console.log('WebSocket was closed')
// 	})
// })




app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`App is listening on port ${port} !`);
});
