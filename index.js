const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const nombreBot = "Nagi Seishiro Sub-Bot";

async function conectarSubBot(numero, res = null) {
    const carpetaSesion = `./sesiones/sesion_${numero}`;
    
    // Si piden un código nuevo desde la web, borra intentos viejos fallidos
    if (res && fs.existsSync(carpetaSesion)) {
        fs.rmSync(carpetaSesion, { recursive: true, force: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(carpetaSesion);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        // 👇 ESTO ES CLAVE PARA QUE WHATSAPP ACEPTE EL CÓDIGO DE 8 DÍGITOS
        browser: Browsers.ubuntu('Chrome'),
        printQRInTerminal: false,
        syncFullHistory: false
    });

    let codigoEnviado = false;

    if (!sock.authState.creds.registered && res) {
        setTimeout(async () => {
            if (codigoEnviado) return;
            try {
                let codigo = await sock.requestPairingCode(numero);
                codigo = codigo?.match(/.{1,4}/g)?.join("-") || codigo;
                codigoEnviado = true;
                res.json({ codigo });
            } catch (err) {
                if (!codigoEnviado) {
                    codigoEnviado = true;
                    res.status(500).json({ error: "Error al generar código. Intenta de nuevo." });
                }
            }
        }, 4000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(`✅ Sub-Bot conectado con éxito: ${numero}`);
        } else if (connection === 'close') {
            const motivo = lastDisconnect?.error?.output?.statusCode;
            if (motivo !== DisconnectReason.loggedOut) {
                conectarSubBot(numero);
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg || !msg.message || msg.key.fromMe) return;

        const remitente = msg.key.remoteJid;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const comando = texto.toLowerCase().trim();

        if (comando === '.menu') {
            const menuTexto = `🌌 *${nombreBot}* 🌌\n\n*Comandos disponibles:*\n• *.menu* - Ver lista de comandos\n• *.ping* - Verificar velocidad\n• *.info* - Información del sistema`;
            await sock.sendMessage(remitente, { text: menuTexto });
        }

        if (comando === '.ping') {
            await sock.sendMessage(remitente, { text: '⚡ ¡Sub-Bot activo y funcionando!' });
        }

        if (comando === '.info') {
            await sock.sendMessage(remitente, { text: 'Sistema de Sub-Bots creado por nagii-hub01.' });
        }
    });
}

app.get('/generar', async (req, res) => {
    const numero = req.query.numero?.replace(/[^0-9]/g, '');
    if (!numero || numero.length < 10) {
        return res.status(400).json({ error: "Escribe un número válido con código de país (ej: 5492604000000)." });
    }
    await conectarSubBot(numero, res);
});

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${nombreBot} | Panel</title>
        <style>
            body { background: #0b0f19; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #151c2c; padding: 25px; border-radius: 15px; box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); width: 90%; max-width: 380px; text-align: center; }
            h2 { color: #818cf8; margin-bottom: 10px; }
            p { font-size: 14px; color: #94a3b8; }
            input { width: 90%; padding: 12px; margin: 15px 0; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #fff; font-size: 16px; text-align: center; }
            button { width: 96%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
            button:hover { background: #4f46e5; }
            #resultado { margin-top: 20px; font-size: 22px; font-weight: bold; color: #38bdf8; letter-spacing: 3px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>🌌 ${nombreBot}</h2>
            <p>Escribe tu número de WhatsApp con código de país (sin el +) para generar tu código de vinculación.</p>
            <input type="text" id="numero" placeholder="Ej: 5492604000000">
            <button onclick="pedirCodigo()">Generar código</button>
            <div id="resultado"></div>
        </div>
        <script>
            async function pedirCodigo() {
                const num = document.getElementById('numero').value;
                const resDiv = document.getElementById('resultado');
                resDiv.style.fontSize = "15px";
                resDiv.innerText = "Generando código, espera 4 segundos...";
                try {
                    const req = await fetch('/generar?numero=' + num);
                    const data = await req.json();
                    if (data.codigo) {
                        resDiv.style.fontSize = "24px";
                        resDiv.innerText = data.codigo;
                    } else {
                        resDiv.style.fontSize = "14px";
                        resDiv.innerText = data.error;
                    }
                } catch (e) {
                    resDiv.innerText = "Error de conexión con el servidor.";
                }
            }
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => console.log('Servidor web activo en puerto ' + PORT));
