require('dotenv').config();
const axios = require('axios');
const { getStore, connectLambda } = require('@netlify/blobs');

const {
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI,
    DISCORD_BOT_TOKEN,
    GUILD_ID,
    VERIFIED_ROLE_ID
} = process.env;

// The main Netlify Function handler
exports.handler = async (event) => {
    // Connect the environment using the official helper
    connectLambda(event);
    // Route based on the path
    if (event.path.endsWith('/auth/discord')) {
        return handleDiscordAuth(event);
    } else if (event.path.endsWith('/auth/discord/callback')) {
        return handleDiscordCallback(event);
    }

    return {
        statusCode: 404,
        body: 'Not Found',
    };
};

// 1. Redirect to Discord OAuth2
const handleDiscordAuth = (event) => {
    const state = event.queryStringParameters.user_id;
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email&state=${state}`;

    return {
        statusCode: 302,
        headers: {
            Location: url,
        },
    };
};

// 2. OAuth2 Callback
const handleDiscordCallback = async (event) => {
    const { code, state } = event.queryStringParameters;

    if (!code) {
        return { statusCode: 400, body: 'Authorization code is missing.' };
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: DISCORD_REDIRECT_URI,
                scope: 'identify email',
            }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const accessToken = tokenResponse.data.access_token;

        // Fetch user data
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { authorization: `Bearer ${accessToken}` },
        });

        const user = userResponse.data;

        // Store user data in Netlify Blobs
        const store = getStore('verified-users');
        const userData = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            email: user.email,
            timestamp: new Date().toISOString(),
        };
        await store.set(user.id, JSON.stringify(userData));

        // Assign verified role
        const guildMemberUrl = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${user.id}/roles/${VERIFIED_ROLE_ID}`;
        await axios.put(guildMemberUrl, {}, {
            headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` },
        });

        // Redirect to success page
        return {
            statusCode: 302,
            headers: {
                Location: '/success',
            },
        };

    } catch (error) {
        console.error('Error during Discord OAuth callback:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return {
            statusCode: 500,
            body: 'An error occurred during verification.',
        };
    }
};