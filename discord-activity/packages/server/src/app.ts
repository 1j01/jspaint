import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
import path from 'path';
import { fetchAndRetry } from './utils';
dotenv.config({ path: '../../.env' });

const app: Application = express();
const port: number = Number(process.env.PORT) || 1999;

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

app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`App is listening on port ${port} !`);
});
