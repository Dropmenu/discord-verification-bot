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

client.on('guildMemberAdd', member => {
    if (member.guild.id !== GUILD_ID) return;

    const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!welcomeChannel) {
        console.error(`Welcome channel with ID ${WELCOME_CHANNEL_ID} not found.`);
        return;
    }

    // The URL for the verification link
    const verificationUrl = `${NETLIFY_SITE_URL}/auth/discord?user_id=${member.id}`;

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Welcome to the Server!')
        .setDescription(`Hello ${member.user}, to gain full access to the server, please verify your account.`)
        .setThumbnail(member.guild.iconURL())
        .addFields({ name: 'How to Verify', value: 'Click the button below to start the verification process.' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Verify Here')
                .setStyle(ButtonStyle.Link)
                .setURL(verificationUrl)
        );

    welcomeChannel.send({
        content: `Welcome, ${member.user}! Please verify.`,
        embeds: [embed],
        components: [row],
    });
});

client.login(DISCORD_BOT_TOKEN)
    .catch(error => console.error('Error logging in:', error));
