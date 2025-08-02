require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions
    ]
});

let verificationMessageId = null;

client.once('ready', async () => {
    console.log(` Bot is online as ${client.user.tag}!`);
    
    // Find verification channel or use first available channel
    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error('L Bot is not in any server!');
        return;
    }

    let verificationChannel = guild.channels.cache.find(channel => 
        channel.name === config.verificationChannelName && channel.isTextBased()
    );

    // If verification channel doesn't exist, use the first text channel
    if (!verificationChannel) {
        verificationChannel = guild.channels.cache.find(channel => channel.isTextBased());
    }

    if (!verificationChannel) {
        console.error('L No text channels found in the server!');
        return;
    }

    console.log(`=� Using channel: #${verificationChannel.name} for verification`);

    // Create verification embed
    const verificationEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('Gotta make sure you\'re human!')
        .setDescription(config.verificationMessage)
        .setFooter({ text: 'Click the reaction below to verify!' });

    try {
        // Send verification message
        const message = await verificationChannel.send({ embeds: [verificationEmbed] });
        await message.react(config.verificationEmoji);
        verificationMessageId = message.id;
        
        console.log(`Verification message posted in #${verificationChannel.name}`);
    } catch (error) {
        console.error('L Error posting verification message:', error);
    }
});

// Handle reaction add (user wants to verify)
client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;

    // Handle partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('L Error fetching reaction:', error);
            return;
        }
    }

    // Check if it's the verification message and correct emoji
    if (reaction.message.id === verificationMessageId && reaction.emoji.name === config.verificationEmoji) {
        const guild = reaction.message.guild;
        const member = guild.members.cache.get(user.id);

        if (!member) {
            console.error(`L Could not find member ${user.tag}`);
            return;
        }

        // Find the verified role
        let verifiedRole = guild.roles.cache.find(role => role.name === config.verifiedRoleName);
        
        // Create role if it doesn't exist
        if (!verifiedRole) {
            try {
                verifiedRole = await guild.roles.create({
                    name: config.verifiedRoleName,
                    color: 0x00ff00,
                    reason: 'Verification role created by bot'
                });
                console.log(` Created ${config.verifiedRoleName} role`);
            } catch (error) {
                console.error('L Error creating verified role:', error);
                return;
            }
        }

        // Add role to user
        try {
            await member.roles.add(verifiedRole);
            console.log(` Added ${config.verifiedRoleName} role to ${user.tag}`);
        } catch (error) {
            console.error(`L Error adding role to ${user.tag}:`, error);
        }
    }
});

// Handle reaction remove (user wants to unverify)
client.on('messageReactionRemove', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;

    // Handle partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('L Error fetching reaction:', error);
            return;
        }
    }

    // Check if it's the verification message and correct emoji
    if (reaction.message.id === verificationMessageId && reaction.emoji.name === config.verificationEmoji) {
        const guild = reaction.message.guild;
        const member = guild.members.cache.get(user.id);

        if (!member) {
            console.error(`L Could not find member ${user.tag}`);
            return;
        }

        // Find the verified role
        const verifiedRole = guild.roles.cache.find(role => role.name === config.verifiedRoleName);
        
        if (!verifiedRole) {
            console.error(`L ${config.verifiedRoleName} role not found`);
            return;
        }

        // Remove role from user
        try {
            await member.roles.remove(verifiedRole);
            console.log(`=4 Removed ${config.verifiedRoleName} role from ${user.tag}`);
        } catch (error) {
            console.error(`L Error removing role from ${user.tag}:`, error);
        }
    }
});

// Error handling
client.on('error', error => {
    console.error('L Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('L Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.BOT_TOKEN).catch(error => {
    console.error('L Failed to login:', error);
});