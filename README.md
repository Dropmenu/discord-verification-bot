# Full-Stack Discord OAuth2 Verification System

This project is a complete verification system for a Discord server, built with a Node.js backend, a static frontend, and a Discord bot. The frontend and OAuth2 flow are handled by Netlify, while the Discord bot is designed to be deployed on a service like Railway.

## Features

- **Frontend**: Simple, clean landing and success pages.
- **Backend**: Serverless Netlify Function handles the entire Discord OAuth2 flow.
- **Database**: Uses Netlify Blobs to store verified user data, requiring zero database setup.
- **Discord Bot**: Welcomes new members and provides a verification link.
- **Role Management**: Automatically assigns a "Verified" role upon successful authentication.

## Project Structure

```
/
├── frontend/              # Static HTML/CSS for the UI
│   ├── index.html         # Landing page with login button
│   ├── success.html       # Page shown after successful verification
│   └── style.css          # Stylesheet
├── netlify/
│   └── functions/
│       ├── auth.js        # Serverless function for OAuth2 flow
│       └── bot/           # Contains the Discord bot logic
│           └── bot.js
├── .env.example           # Example environment variables
├── .gitignore             # Files to ignore in git
├── netlify.toml           # Netlify configuration file
└── package.json           # Project dependencies
```

## Setup and Deployment

### 1. Discord Application Setup

1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Create a **New Application**.
3.  Go to the **Bot** tab and click **Add Bot**. 
    - Enable **Server Members Intent**.
    - Copy the **Bot Token** and save it for your `.env` file (`DISCORD_BOT_TOKEN`).
4.  Go to the **OAuth2 -> General** tab.
    - Copy the **Client ID** (`DISCORD_CLIENT_ID`) and generate a **Client Secret** (`DISCORD_CLIENT_SECRET`).
5.  Add a **Redirect URI**. This will be your Netlify site's callback URL:
    - `https://clinquant-mooncake-014457.netlify.app/.netlify/functions/auth/auth/discord/callback`

### 2. Discord Server Setup

1.  Create a role named `Verified` (or any name you prefer) in your Discord server. Right-click the role and copy its ID (`VERIFIED_ROLE_ID`).
2.  Create a channel named `#welcome` (or similar) where the bot will post verification messages. Copy its ID (`WELCOME_CHANNEL_ID`).
3.  Invite the bot to your server using an OAuth2 URL. Go to **OAuth2 -> URL Generator**, select the `bot` and `applications.commands` scopes, and give it Administrator permissions. Copy the generated URL and paste it into your browser.

### 3. Netlify Setup (Frontend & OAuth2 Function)

1.  Fork this repository and connect it to a new site on [Netlify](https://netlify.com).
2.  **Build Settings**:
    - **Base directory**: Not set
    - **Build command**: `npm install`
    - **Publish directory**: `frontend`
    - **Functions directory**: `netlify`
3.  **Environment Variables**:
    - Go to **Site settings > Build & deploy > Environment** and add the following variables:
      - `DISCORD_CLIENT_ID`: Your bot's client ID.
      - `DISCORD_CLIENT_SECRET`: Your bot's client secret.
      - `DISCORD_REDIRECT_URI`: The full redirect URI you set in the Discord Developer Portal.
      - `DISCORD_BOT_TOKEN`: Your bot's token.
      - `GUILD_ID`: The ID of your Discord server.
      - `VERIFIED_ROLE_ID`: The ID of the role for verified users.
      - `WELCOME_CHANNEL_ID`: The ID of the channel for welcome messages.
      - `NETLIFY_SITE_URL`: The base URL of your Netlify site (`https://clinquant-mooncake-014457.netlify.app`).

### 4. Railway Setup (Discord Bot)

1.  Create a new project on [Railway](https://railway.app) and link it to your forked GitHub repository.
2.  **Build Settings**:
    - **Root Directory**: `.` (or leave blank)
    - **Build Command**: `npm install`
    - **Start Command**: `node netlify/functions/bot/bot.js`
3.  **Environment Variables**:
    - In the Railway project dashboard, go to the **Variables** tab and add the same environment variables as in the Netlify setup.

## How It Works

1.  A new user joins the Discord server.
2.  The **Discord Bot** (on Railway) detects the new member and sends a message in the `#welcome` channel with a 'Verify' button.
3.  The user clicks the button, which links to the `/auth/discord` route on the **Netlify site**.
4.  The `auth.js` **Netlify Function** redirects the user to Discord's OAuth2 consent screen.
5.  After authorization, Discord redirects the user back to the function's callback route.
6.  The function exchanges the authorization code for an access token, fetches the user's profile, and assigns the `Verified` role using the Discord API.
7.  The user's data is stored in **Netlify Blobs** for record-keeping.
8.  The user is redirected to the `/success.html` page.
