
// Discord Embedded App SDK, bundled with Skypack, saved from:
// https://cdn.skypack.dev/-/@discord/embedded-app-sdk@v1.2.0-QXsdBg8VfgltgT8IEtBP/dist=es2019,mode=imports/optimized/@discord/embedded-app-sdk.js
const Discord = await import("../lib/discord-embedded-app-sdk-v1.2.0-bundled-with-skypack.js");
// @ts-ignore
window._Discord = Discord;

const CLIENT_ID = "1234578915415167067"; // TODO: get from .env

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
		// "applications.builds.upload",
		// "applications.builds.read",
		// "applications.store.update",
		// "applications.entitlements",
		// "bot",
		'identify',
		// "connections",
		// "email",
		// "gdm.join",
		'guilds',
		// "guilds.join",
		'guilds.members.read',
		// "messages.read",
		// "relationships.read",
		// 'rpc.activities.write',
		// "rpc.notifications.read",
		// "rpc.voice.write",
		// 'rpc.voice.read',
		// "webhook.incoming",
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

// Get guild specific nickname and avatar, and fallback to user name and avatar
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
		const target = e.target;
		if (target.tagName === 'A' && target.href) {
			e.preventDefault();
			discordSdk.commands.openExternalLink({ url: target.href });
		}
	});
	window.open = (url) => discordSdk.commands.openExternalLink({ url });
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