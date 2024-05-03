// @ts-check

// Discord Embedded App SDK, bundled with Skypack, saved from:
// https://cdn.skypack.dev/-/@discord/embedded-app-sdk@v1.2.0-QXsdBg8VfgltgT8IEtBP/dist=es2019,mode=imports/optimized/@discord/embedded-app-sdk.js
const Discord = await import("../lib/discord-embedded-app-sdk-v1.2.0-bundled-with-skypack.js");
// @ts-ignore
window._Discord = Discord;

const CLIENT_ID = "$$$$$CLIENT_ID$$$$$"; // monkey-patched in by the server
const APPLICATION_ID = CLIENT_ID; // seems to be the same

const DISCORD_API_BASE = "https://discord.com/api";

const { DiscordSDK } = Discord;
const discordSdk = new DiscordSDK(CLIENT_ID);
await discordSdk.ready();

// Authorize with Discord Client
const { code } = await discordSdk.commands.authorize({
	client_id: CLIENT_ID,
	response_type: 'code',
	state: '',
	prompt: 'none',
	// More info on scopes here: https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
	scope: [
		// At least one scope is required. Otherwise authorize will throw an error.
		// Likely useful scopes:
		'identify', // for user presence, and including username/avatar in the undo history window (Edit > History)
		// 'guilds.members.read', // for server-specific nicknames/avatars
		// 'messages.read', // could plug into the interpret_command of Extras > Speech Recognition (not sure how useless this would be on a scale of Google Assistant to Twitch Plays Pokemon)
		// For Extras > Speech Recognition, could use something like https://github.com/Rei-x/discord-speech-recognition
		// but that works server-side as a bot. There's 'rpc.voice.read' but I don't see a way to get the audio stream.
		// There's also 'voice'... but the docs are hard to find.
	],
});

// Retrieve an access_token from your embedded app's server
const response = await fetch('/api/token', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		code,
	}),
});
const { access_token } = await response.json();

// Authenticate with Discord client (using the access_token)
const newAuth = await discordSdk.commands.authenticate({
	access_token,
});

// Get guild specific nickname and avatar, and fallback to user name and avatar?
/** @type {IGuildsMembersRead | null} */
const guildMember = await fetch(
	`/discord/api/users/@me/guilds/${discordSdk.guildId}/member`,
	{
		method: 'get',
		headers: { Authorization: `Bearer ${access_token}` },
	},
)
	.then((j) => j.json())
	.catch(() => {
		return null;
	});

export function handleExternalLinks() {
	document.addEventListener('click', (e) => {
		if (e.defaultPrevented) return;
		const target = e.target;
		if (target.tagName === 'A' && target.href && target.target === '_blank') {
			e.preventDefault();
			discordSdk.commands.openExternalLink({ url: target.href });
		}
	});
	window.open = (url) => discordSdk.commands.openExternalLink({ url });
}

export async function shareImage(blob, filename) {
	const mimeType = blob.type;

	// image data as buffer
	const buf = await blob.arrayBuffer();

	// image as file
	const imageFile = new File([buf], filename, { type: mimeType });

	const body = new FormData();
	body.append('file', imageFile);

	const attachmentResponse = await fetch(`${DISCORD_API_BASE}/applications/${APPLICATION_ID}/attachment`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
		body,
	});
	const attachmentJson = await attachmentResponse.json();

	// mediaUrl is an ephemeral Discord CDN URL
	const mediaUrl = attachmentJson.attachment.url;

	// opens dialog in Discord client
	await discordSdk.commands.openShareMomentDialog({ mediaUrl });
}

export { Discord, discordSdk, guildMember, newAuth };

// Done with discord-specific setup

// // Now we create a colyseus client
// const wsUrl = `wss://${location.host}/api/colyseus`;
// const client = new Client(wsUrl);

// let roomName = 'Channel';

// // Requesting the channel in GDMs (when the guild ID is null) requires
// // the dm_channels.read scope which requires Discord approval.
// if (discordSdk.channelId != null && discordSdk.guildId != null) {
// 	// Over RPC collect info about the channel
// 	const channel = await discordSdk.commands.getChannel({ channel_id: discordSdk.channelId });
// 	if (channel.name != null) {
// 		roomName = channel.name;
// 	}
// }

// // Get the user's guild-specific avatar uri
// // If none, fall back to the user profile avatar
// // If no main avatar, use a default avatar
// const avatarUri = getUserAvatarUrl({
// 	guildMember,
// 	user: newAuth.user,
// });
// console.log(avatarUri);

// // Get the user's guild nickname. If none set, fall back to global_name, or username
// // Note - this name is note guaranteed to be unique
// const name = getUserDisplayName({
// 	guildMember,
// 	user: newAuth.user,
// });
// console.log(name);


// // The second argument has to include for the room as well as the current player
// const newRoom = await client.joinOrCreate < State > (GAME_NAME, {
// 	channelId: discordSdk.channelId,
// 	roomName,
// 	userId: newAuth.user.id,
// 	name,
// 	avatarUri,
// });

// // Finally, we construct our authenticatedContext object to be consumed throughout the app
// setAuth({ ...newAuth, guildMember, client, room: newRoom });