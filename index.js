
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Use local auth to persist session
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log('Scan this QR with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});


  
client.on('ready', () => {
    console.log('✅ Client is ready!');
    
    // group name
    const groupName = "Co*as de Ferro Sabado 11h";
    let written = 1;
    let lastNum = 0;
    let integer;
    let claudioNum;
    let ricardoNum;

    let stringSliced;
    let indexToSlice;

    // Find the group
    client.getChats().then(chats => {

        const group = chats.find(chat => chat.isGroup && chat.name === groupName);

        if (!group) {
            console.log("❌ Group not found.");
            return;
        }

        client.on('message', async message =>{
            if ((
            message.body.toLowerCase().includes("⚽ albogas") || 
            message.body.toLowerCase().includes("⚽albogas") ||
            message.body.toLowerCase().includes("⚽ quinta") ||
            message.body.toLowerCase().includes("⚽quinta") ||
            message.body.toLowerCase().includes("⚽ quinta albogas") ||
            message.body.toLowerCase().includes("⚽ albogas quinta") ||
            message.body.toLowerCase().includes("albogas quinta 22h") || 
            message.body.toLowerCase().includes("quinta albogas 22h")
            ) && written === 1
            ) {
                console.log("✅ Message read!");

                lastNum = message.body.lastIndexOf("\n") + 1;
                integer = Number(message.body[lastNum]);
                claudioNum = integer+1;
                ricardoNum = integer+2;
                //client.sendMessage(group.id._serialized, message.body + "\n" + claudioNum + 
                //    " - Claudio \n" + ricardoNum + " - Ricardo");

                if (message.body.toLowerCase().includes("11") || message.body.toLowerCase().includes("12")) {

                    indexToSlice = message.body.lastIndexOf("11");
                    stringSliced = message.body.slice(0, indexToSlice);

                    client.sendMessage(group.id._serialized, stringSliced + "11 - Claudio \n12 - Ricardo"); 
                }
                else {
                    client.sendMessage(group.id._serialized, message.body + "\n11 - Claudio \n12 - Ricardo"); 
                }
                   
                console.log("✅ Message sent!");
                written--;
            }
        })


    });
});

client.initialize();
