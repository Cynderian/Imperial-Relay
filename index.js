// Helpful info:
// All files under the comms folder designate which channels can act as an input to the system or as an output (or both).
// Fill out the txt files with the channel ids you want to be relayed to, with each ID having its own line.
// Bot token goes in .env file

// note:
// since I last touched it, it now spits out the contents of the txt files it reads from onto the command line... this
// is highly unexpected behavior but I cannot diagnose what causes it or how to stop it, but it does not appear to
// impact the functionality in any way so /shrug

import { config } from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs'
import readline from 'readline'

config();

const client = new Client({
     intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
const TOKEN = process.env.TOKEN;

client.login(TOKEN)

client.on('ready', () => {
    console.log(`${client.user.tag} is now online`);
});

// vars
let lastOnewayMessages = []

// pvp relay
// works off of 2 way channels only in its current state
client.on('messageCreate', (message) => {
    if (!message.author.bot && message.content.includes('sos')) { // filter messages by content
        const firstInterface = readline.createInterface({
            input: fs.createReadStream('./comms/two-way.txt'),
            output: process.stdout,
            console: false
        });
        firstInterface.on('line', function(line1) {
            if (line1 == message.channelId) {
                const originId = message.channelId;
                const secondInterface = readline.createInterface({
                    input: fs.createReadStream('./comms/two-way.txt'),
                    output: process.stdout,
                    console: false
                });
                secondInterface.on('line', function(line2) {
                    if (line2 != message.channelId) {
                        message.channelId = line2
                        try {
                            message.channel.send(message.content);
                        } catch (error) {
                            console.error(error)
                        }
                    }
                });
            }
        });

    }
});

// objs relay
/*
client.on('messageCreate', (message) => {
    if (!message.author.bot) {
        lastOnewayMessages = []
        const inputInterface = readline.createInterface({
            input: fs.createReadStream('./comms/inputs.txt'),
            output: process.stdout,
            console: false
        });
        inputInterface.on('line', function(line1) {
            if (line1 == message.channelId) {
                const outputInterface = readline.createInterface({
                    input: fs.createReadStream('./comms/outputs.txt'),
                    output: process.stdout,
                    console: false
                });
                outputInterface.on('line', function(line2) {
                    message.channelId = line2
                    try {
                        let msg = message.channel.send(message.content).then(sentmessage => lastOnewayMessages.push(sentmessage))
                    } catch (error) {
                        console.error(`Error: ${error}`)
                    }
                });
            }
        });
    }
});
*/

// relay edited messages (works for one-way only)
client.on('messageUpdate', (oldMessage, newMessage) => {
    if (!newMessage.author.bot) {
        lastOnewayMessages.forEach(message => {
            message.edit(newMessage.content);
        })
    }
});