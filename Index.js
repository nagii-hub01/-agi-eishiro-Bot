const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');

// 👇 PON AQUÍ TU NÚMERO DE TELÉFONO CON CÓDIGO DE PAÍS (sin el +)
const numeroBot = "549260401957"; 
const nombreBot = "Nagi Seishiro Bot";

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesion_nagi');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: [nombreBot, "Nagi Seishiro", "1.0.0"]
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let codigo = await sock.requestPairingCode(numeroBot);
            console.log(`\n========================================`);
            console.log(`TU CÓDIGO DE VINCULACIÓN ES: ${codigo}`);
            console.log(`========================================\n`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log(`¡${nombreBot} está conectado y listo!`);
        } else if (connection === 'close') {
            console.log('Conexión cerrada, reconectando...');
            iniciarBot();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remitente = msg.key.remoteJid;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const comando = texto.toLowerCase().trim();

        if (comando === '.menu') {
            const menuTexto = `⚽ *${Nagii}* ⚽\n\nHola, soy un bot llamado Nagi Seishiro.\n\n*Comandos disponibles:*\n• *.menu* - Ver esta lista\n• *.ping* - Ver si estoy activo\n• *.info* - Datos del creador\n *.robar*  - Robar Nagi coins' ;
            await sock.sendMessage(remitente, { text: menuTexto });
        }

        if (comando === '.ping') {
            await sock.sendMessage(remitente, { text: '¡Activo y listo para jugar! ⚡' });
        }

        if (comando === '.info') {
            await sock.sendMessage(remitente, { text: `Bot creado por nagii-hub01.` });
        }
    });
}

iniciarBot();
