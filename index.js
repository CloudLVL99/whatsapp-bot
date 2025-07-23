const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

const groupName = "Co*as de Ferro Sabado 11h";
const CLAUDIO = "Cláudio";
const RICARDO = "Ricardo";
let hasResponded = false;

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

function includesKeyword(text) {
    const lower = text.toLowerCase();
    return matchKeywords.some(keyword => lower.includes(keyword));
}

function hasName(text, name) {
    return text.toLowerCase().includes(name.toLowerCase());
}

function appendPlayers(originalText, startNum = 11) {
    return `${originalText}\n${startNum} - ${CLAUDIO}\n${startNum + 1} - ${RICARDO}`;
}

function determineResponse(messageText) {
    const lower = messageText.toLowerCase();
    const hasClaudio = hasName(lower, "claudio") || hasName(lower, "cláudio");
    const hasRicardo = hasName(lower, "ricardo");

    if (hasClaudio && hasRicardo) return null; // No action needed

    const has11or12 = lower.includes("11") || lower.includes("12");
    if (has11or12) {
        const indexToSlice = messageText.lastIndexOf("11");
        const trimmedText = messageText.slice(0, indexToSlice);

        if (hasClaudio) return `${trimmedText}12 - ${RICARDO}`;
        if (hasRicardo) return `${trimmedText}12 - ${CLAUDIO}`;
        return `${trimmedText}11 - ${CLAUDIO}\n12 - ${RICARDO}`;
    } else {
        if (hasClaudio) return `${messageText}\n12 - ${RICARDO}`;
        if (hasRicardo) return `${messageText}\n12 - ${CLAUDIO}`;
        return `${messageText}\n11 - ${CLAUDIO}\n12 - ${RICARDO}`;
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

            const response = determineResponse(message.body);
            if (response) {
                await client.sendMessage(group.id._serialized, response);
                console.log("✍️ Message sent to group.");
            } else {
                console.log("❌ Names already included. No action taken.");
            }

            hasResponded = true; // Prevent further replies
        }
    });
});

client.initialize();