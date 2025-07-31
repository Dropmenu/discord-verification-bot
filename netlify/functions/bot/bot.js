require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const {
    DISCORD_BOT_TOKEN,
    GUILD_ID,
    WELCOME_CHANNEL_ID,
    NETLIFY_SITE_URL // e.g., https://your-site-name.netlify.app
} = process.env;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Bot is ready and listening for new members.');
});

client.on('guildMemberAdd', async member => {
    if (member.guild.id !== GUILD_ID) return;

    // Construct the verification URL
    const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope: 'identify email guilds',
        state: member.id, // Pass the user's ID in the state parameter
    });
    const verificationUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

    // Create the message components
    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Verification Required')
        .setDescription(`Welcome to ${member.guild.name}! To gain access, please verify your account.`);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Verify')
                .setStyle(ButtonStyle.Link)
                .setURL(verificationUrl)
        );

    try {
        // 1. Try to send a Direct Message
        await member.send({ embeds: [embed], components: [row] });
        console.log(`Sent verification DM to ${member.user.tag}`);
    } catch (error) {
        // 2. If DMs are disabled, fall back to the public channel
        console.warn(`Could not send DM to ${member.user.tag}. Falling back to welcome channel.`);
        const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
        if (channel) {
            await channel.send({
                content: `Welcome, ${member}! I couldn't send you a private message. Please click the button below to verify.`,
                embeds: [embed],
                components: [row]
            });
            console.log(`Sent public fallback message to ${member.user.tag} in #${channel.name}`);
        } else {
            console.error(`Error: Welcome channel with ID ${WELCOME_CHANNEL_ID} not found for fallback message.`);
        }
    }
});

client.login(DISCORD_BOT_TOKEN)
    .catch(error => console.error('Error logging in:', error));
