# Discord Embedded App Starter

This repo is a minimal starter-project. Getting an embedded app running in Discord can be complex. The goal of this example is to get you up-and-running as quickly as possible, while making it easy to swap in pieces to fit your embedded app's client and server needs.

## Client architecture

The client (aka front-end) is using [ViteJS](https://vitejs.dev/)'s Vanilla Typescript starter project. Vite has great starter projects in [many common javascript frameworks](https://vitejs.dev/guide/#trying-vite-online). All of these projects use the same config setup, which means that if you prefer React, Svelte, etc... you can swap frameworks and still get the following:

- Fast typescript bundling with hot-module-reloading
- Identical configuration API
- Identical environment variable API

Note: ViteJS is not required to use Discord's `embedded-app-sdk`. ViteJS is a meta-client-framework we are using to make it easy to help you get running quickly, but the core concepts of developing an embedded application are the same, regardless of how you are consuming `embedded-app-sdk`.

## Server architecture

The server (aka back-end) is using Express with typescript. Any file in the server project can be imported by the client, in case you need to share business logic.

## Setting up your Discord Application

Before we write any code, lets follow the instructions [here](https://discord.com/developers/docs/activities/building-an-activity#step-1-creating-a-new-app) to make sure your Discord application is set up correctly.

## Setting up your environment variables

In this directory (`/examples/discord-activity-starter`) we need to create a `.env` file with the OAuth2 variables, as described [here](https://discord.com/developers/docs/activities/building-an-activity#find-your-oauth2-credentials).

```env
VITE_CLIENT_ID=123456789012345678
CLIENT_SECRET=abcdefghijklmnopqrstuvwxyzabcdef
```

### Adding a new environment variable

In order to add new environment variables, you will need to do the following:

1. Add the environment key and value to `.env`
2. Add the key to [/examples/discord-activity-starter/packages/client/src/vite-env.d.ts](/examples/discord-activity-starter/packages/client/src/vite-env.d.ts)
3. Add the key to [/examples/discord-activity-starter/packages/server/environment.d.ts](/examples/discord-activity-starter/packages/server/environment.d.ts)

This will ensure that you have type safety when consuming your environment variables

## Running your app locally

As described [here](https://discord.com/developers/docs/activities/building-an-activity#step-4-running-your-app-locally-in-discord), we encourage using a tunnel solution such as [cloudflared](https://github.com/cloudflare/cloudflared#installing-cloudflared) for local development.
To run your app locally, run the following from this directory (/examples/discord-activity-starter)

```
pnpm install # only need to run this the first time
pnpm dev
pnpm tunnel # from another terminal
```

Be sure to complete all the steps listed [here](https://discord.com/developers/docs/activities/building-an-activity) to ensure your development setup is working as expected.
