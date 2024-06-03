import bodyParser from "body-parser";
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
// import enableWs from "express-ws";
import fs from "fs";
import path from "path";
import { fetchAndRetry } from "./utils";
dotenv.config({ path: "../../.env" });

const app: Application = express();
const port: number = Number(process.env.PORT) || 1999;

// enableWs(app);

app.use(express.json());

const clientSourcePath = path.join(__dirname, "../../../..");
const clientId = process.env.VITE_CLIENT_ID;
const clientIdNeedle = "$$$$$CLIENT_ID$$$$$"; // same length as the client ID, just in case
const urlPathForPatching = "/src/discord-activity-client.js";
const fsPathForPatching = path.join(clientSourcePath, urlPathForPatching);
// Ensure the file exists and prepare it for serving
// const patchedFileContent = fs.readFileSync(fsPathForPatching, "utf8").replace(clientIdNeedle, clientId);
// // Serve the patched file
// app.get(urlPathForPatching, (req, res) => {
// 	res.setHeader("Content-Type", "text/javascript");
// 	res.send(patchedFileContent);
// });
if (!fs.existsSync(fsPathForPatching)) {
	throw new Error(`Could not find file at ${fsPathForPatching}`);
}
// Serve the patched file without caching it, for development purposes
app.get(urlPathForPatching, (req, res) => {
	fs.readFile(fsPathForPatching, "utf8", (err, data) => {
		if (err) {
			res.status(500).send(err);
			return;
		}
		res.setHeader("Content-Type", "text/javascript");
		res.send(data.replace(clientIdNeedle, clientId));
	});
});

// if (process.env.NODE_ENV === "production") {
//   const clientBuildPath = path.join(__dirname, "../../client/dist");
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
		res.status(403).send("Forbidden");
		return;
	}
	next();
});
app.use(express.static(clientSourcePath));

// Fetch token from developer portal and return to the embedded app
app.post("/api/token", async (req: Request, res: Response) => {
	const response = await fetchAndRetry(`https://discord.com/api/oauth2/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: process.env.VITE_CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			grant_type: "authorization_code",
			code: req.body.code,
		}),
	});

	const { access_token } = (await response.json()) as {
		access_token: string;
	};

	res.send({ access_token });
});

// Simple multiplayer image editing

const rooms: { [key: string]: string } = {};

// app.post("/api/rooms", (req: Request, res: Response) => {
// 	const roomId = uuid(); // or the room id might be the Discord Activity instance ID
// 	rooms[roomId] = "";
// 	res.send({ roomId });
// });

app.get("/api/rooms/:roomId/data", (req: Request, res: Response) => {
	const { roomId } = req.params;
	res.send(rooms[roomId]);
});

app.put("/api/rooms/:roomId/data", bodyParser.text({ type: "*/*" }), (req: Request, res: Response) => {
	const { roomId } = req.params;
	const image = req.body;
	rooms[roomId] = image;
	res.send({ success: true });
});

// app.ws("/api/sessions/:session_id", (ws, req) => {
// console.log("WebSocket support is enabled")
// @ts-ignore
// app.ws("/api/session", (ws, req) => {
// 	console.log("WebSocket was opened")

// 	ws.on("message", (msg: string) => {
// 		console.log("Received message", msg)
// 		ws.send(msg)
// 	})

// 	ws.on("close", () => {
// 		console.log("WebSocket was closed")
// 	})
// })




app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`App is listening on port ${port} !`);
});
