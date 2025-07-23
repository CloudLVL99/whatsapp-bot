const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

const groupName = "Co*as de Ferro Sabado 11h";
const CLAUDIO = "Cláudio";
const RICARDO = "Ricardo";
const MAX_PLAYERS = 12;
let hasResponded = false;

const matchKeywords = [
    "⚽ albogas", "⚽albogas",
    "⚽ quinta", "⚽quinta",
    "⚽ quinta albogas", "⚽ albogas quinta",
    "albogas quinta 22h", "quinta albogas 22h"
];

function includesKeyword(text) {
    const lower = text.toLowerCase();
    return matchKeywords.some(keyword => lower.includes(keyword));
}

function parseMessage(message) {
    const lines = message.trim().split('\n');
    const header = lines[0];
    const players = Array(MAX_PLAYERS).fill(null);

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(/^(\d{1,2})\s*-\s*(.+)$/);
        if (match) {
            const num = parseInt(match[1]);
            const name = match[2].trim();
            if (num >= 1 && num <= MAX_PLAYERS) {
                players[num - 1] = name;
            }
        }
    }

    return { header, players };
}

function formatMessage(header, players) {
    const lines = [header];
    for (let i = 0; i < MAX_PLAYERS; i++) {
        const name = players[i] ?? "";
        lines.push(`${i + 1} - ${name}`);
    }
    return lines.join('\n');
}

function insertPlayer(players, name, preferredSlot) {
    if (!players.includes(name)) {
        if (players[preferredSlot - 1] === null) {
            players[preferredSlot - 1] = name;
        } else {
            // Find first available slot
            const emptyIndex = players.findIndex(p => p === null);
            if (emptyIndex !== -1) players[emptyIndex] = name;
        }
    }
}

client.on('qr', qr => {
    console.log('📱 Scan this QR with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ Client is ready!');

    const chats = await client.getChats();
    const group = chats.find(chat => chat.isGroup && chat.name === groupName);

    if (!group) {
        console.log("❌ Group not found.");
        return;
    }

    client.on('message', async message => {
        if (!hasResponded && includesKeyword(message.body)) {
            console.log("✅ Relevant message detected!");

            const { header, players } = parseMessage(message.body);

            insertPlayer(players, CLAUDIO, 11);
            insertPlayer(players, RICARDO, 12);

            const response = formatMessage(header, players);
            await client.sendMessage(group.id._serialized, response);

            console.log("✍️ Message sent with updated player list.");
            hasResponded = true;
        }
    });
});

client.initialize();