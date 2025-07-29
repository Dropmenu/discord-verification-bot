require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const { getStore } = require('@netlify/blobs');
let store;

const app = express();

// Middleware to make the blob store available in requests
app.use((req, res, next) => {
    req.store = store;
    next();
});
const router = express.Router();

const {
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI,
    DISCORD_BOT_TOKEN,
    GUILD_ID,
    VERIFIED_ROLE_ID,
    NETLIFY_SITE_ID,
    NETLIFY_API_TOKEN
} = process.env;

// 1. Redirect to Discord OAuth2
router.get('/auth/discord', (req, res) => {
    const state = req.query.user_id; // Pass user_id as state
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email&state=${state}`;
    res.redirect(url);
});

// 2. OAuth2 Callback
router.get('/auth/discord/callback', async (req, res) => {
    const { code, state } = req.query;
    const userId = state;

    if (!code) {
        return res.status(400).send('Authorization code is missing.');
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
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = tokenResponse.data.access_token;

        // Fetch user data from Discord
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `Bearer ${accessToken}`,
            },
        });

        const user = userResponse.data;

        // Store user data in Netlify Blobs
        const userData = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar,
            email: user.email,
            locale: user.locale,
            verified: user.verified,
            timestamp: new Date().toISOString(),
        };
        await req.store.set(user.id, JSON.stringify(userData));

        // Assign verified role to the user
        const guildMemberUrl = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${user.id}/roles/${VERIFIED_ROLE_ID}`;
        await axios.put(guildMemberUrl, {}, {
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        // Redirect to success page
        res.redirect('/success');

    } catch (error) {
        console.error('Error during Discord OAuth callback:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        res.status(500).send('An error occurred during verification.');
    }
});

app.use('/', router);

const handler = serverless(app);

// The new handler that initializes the store before running the app
module.exports.handler = async (event, context) => {
    // Initialize the store using the function context
    store = getStore('verified-users');
    
    // Pass the event to the serverless handler
    return handler(event, context);
};