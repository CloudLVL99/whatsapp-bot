// Import required packages
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize WhatsApp client with session persistence
const client = new Client({
    authStrategy: new LocalAuth() // Saves session locally so you don't need to scan every time
});

// Target group name (must match exactly)
const groupName = "Co*as de Ferro Sabado 11h";

// Names to automatically insert into the list
const CLAUDIO = "Cláudio";
const RICARDO = "Ricardo";

// Number of maximum players in the list
const MAX_PLAYERS = 12;

// Ensure we only respond once per session unless reset
let hasResponded = false;

// Keywords to detect messages that are about the football game
const matchKeywords = [
    "⚽ albogas",
    "⚽albogas",
    "⚽ quinta", 
    "⚽quinta",
    "⚽ quinta albogas", 
    "⚽ albogas quinta",
    "albogas quinta 22h", 
    "quinta albogas 22h"
];

/**
 * Normalize names for case-insensitive and accent-insensitive matching.
 * For example: "Cláudio" and "claudio" become the same.
 */
function normalizeName(name) {
    return name
        .toLowerCase()
        .normalize("NFD")                // Decompose accents (á = 1 character; becomes á = 2 characters ))
        .replace(/[\u0300-\u036f]/g, ""); // Remove accent characters (in tge example above, removes the 2nd character '´', becomming only 'a')
}

/**
 * Parses the incoming WhatsApp message and extracts the header and player list.
 * The player list is stored as an array with indexes 0-11 representing positions 1-12.
 */
function parseMessage(messageText) {
    const lines = messageText.trim().split('\n');
    const header = lines[0]; // First line is the message header
    const players = Array(MAX_PLAYERS).fill(null); // Initialize 12 empty slots

    for (let i = 1; i < lines.length; i++) {
        const match = lines[i].match(/^(\d{1,2})\s*-?\s*(.+)$/); // Match "N - Name"
        if (match) {
            const num = parseInt(match[1]);
            const name = match[2].trim();
            if (num >= 1 && num <= MAX_PLAYERS) {
                players[num - 1] = name; // Fill slot
            }
        }
    }

    return { header, players };
}

/**
 * Formats the message to send back to WhatsApp with the required layout.
 * Always includes all 12 positions, even if some are empty.
 */
function formatMessage(header, players) {
    const lines = [header];
    for (let i = 0; i < MAX_PLAYERS; i++) {
        const name = players[i] ?? ""; // Empty string if name slot is null
        lines.push(`${i + 1} - ${name}`);
    }
    return lines.join('\n');
}

/**
 * Inserts a player name into the last available position in the list.
 * Will not insert if the name is already in the list.
 */
function insertPlayerLast(players, nameToInsert) {
    const normTarget = normalizeName(nameToInsert);
    const alreadyExists = players.some(
        p => p && normalizeName(p) === normTarget
    );

    if (!alreadyExists) {
        // Insert at the last empty slot from 12 → 1
        for (let i = MAX_PLAYERS - 1; i >= 0; i--) {
            if (!players[i]) {
                players[i] = nameToInsert;
                break;
            }
        }
    }
}

/**
 * Checks if the message contains any football-related keyword
 */
function includesKeyword(text) {
    const lower = text.toLowerCase();
    return matchKeywords.some(keyword => lower.includes(keyword));
}

// Show QR code for authentication
client.on('qr', qr => {
    console.log('📱 Scan this QR with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Once client is ready, start listening for messages
client.on('ready', async () => {
    console.log('✅ Client is ready!');

    // Get all WhatsApp chats
    const chats = await client.getChats();

    // Find the specific group chat by name
    const group = chats.find(chat => chat.isGroup && chat.name === groupName);

    if (!group) {
        console.log("❌ Group not found.");
        return;
    }

    // Listen for all incoming messages
    client.on('message', async message => {

        // Only respond if:
        // 1. It's the first relevant message (hasResponded is false)
        // 2. The message contains football keywords
        if (
            !hasResponded &&    // comment to debug
            includesKeyword(message.body)) {

            console.log("✅ Relevant message detected!");

            // Parse the header and player list
            const { header, players } = parseMessage(message.body);

            // Try to insert Cláudio and Ricardo in last available spots
            insertPlayerLast(players, CLAUDIO);
            insertPlayerLast(players, RICARDO);

            // Format the new message to send back to the group
            const finalMessage = formatMessage(header, players);
            await client.sendMessage(group.id._serialized, finalMessage);

            console.log("✍️ Message sent with new list.");

            // Prevent multiple replies to the same list
            hasResponded = true;
        }
    });
});

// Start the WhatsApp client
client.initialize();
//123