const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const http = require('http');

// Servidor web pequeño para que Render mantenga el bot encendido
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Nagi Seishiro Bot esta activo!');
}).listen(process.env.PORT || 3000);

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
        browser: [nombreBot, "Chrome", "1.0.0"]
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let codigo = await sock.requestPairingCode(numeroBot);
            console.log(`========================================`);
            console.log(`TU CODIGO DE VINCULACION ES: ${codigo}`);
            console.log(`========================================`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log(`¡${nombreBot} esta conectado y listo!`);
        } else if (connection === 'close') {
            console.log('Conexion cerrada, reconectando...');
            iniciarBot();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg || !msg.message || msg.key.fromMe) return;

        const remitente = msg.key.remoteJid;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const comando = texto.toLowerCase().trim();

        if (comando === '.menu') {
            const menuTexto = `⚽ *${𝐍agibot}* ⚽\n\nHola, soy un bot creado desde cero.\n\n*Comandos disponibles:*\n• *.menu* - Ver esta lista\n• *.ping* - Ver si estoy activo\n• *.info* - Datos del creador`;
            await sock.sendMessage(remitente, { text: menuTexto });
        }

        if (comando === '.ping') {
            await sock.sendMessage(remitente, { text: '¡Activo y listo para jugar! ⚡' });
        }

        if (comando === '.info') {
            await sock.sendMessage(remitente, { text: 'Bot creado por nagii-hub01.' });
        }
    });
}

iniciarBot();
