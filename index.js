
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers
} = await import("@whiskeysockets/baileys");

import express from "express";
import pino from "pino";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const OWNER = process.env.OWNER_NUMBER || "";
const PREFIX = "!";
const BOT_NAME = "Nagi Seishiro Bot";
const START_TIME = Date.now();

let sock = null;
let connecting = false;
let reconnectTimer = null;

function runtime() {
  const sec = Math.floor((Date.now() - START_TIME) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

function menu() {
  return `ᕬ  ᕬㅤㅤ𝐍𝐀𝐆𝐈 ੭୧
⚽ 𝐒𝐄𝐈𝐒𝐇𝐈𝐑𝐎 𝐁𝐎𝐓 🎮

❨ ⚽ ❩ 𝐌𝐀𝐈𝐍 𝐌𝐄𝐍𝐔
• !menu
• !help
• !ping
• !owner
• !botinfo
• !runtime
• !speed

❨ 🎮 ❩ 𝐆𝐀𝐌𝐄𝐒
• !ppt piedra/papel/tijera
• !dado
• !moneda
• !8ball
• !ship
• !quiz

❨ ⚽ ❩ 𝐅𝐔𝐍
• !frase
• !chiste
• !love
• !amistad
• !abrazo
• !report

ㅤㅤ𓂂𓂂 𝐍𝐀𝐆𝐈 𝐒𝐄𝐈𝐒𝐇𝐈𝐑𝐎
ㅤㅤㅤㅤ𖹭 𝐁𝐎𝐓 𖹭`;
}

const frases = [
  "Qué fastidio... ¿podemos dormir?",
  "Jugar videojuegos es mucho más fácil.",
  "No tengo ganas de hacer nada.",
  "Qué complicado...",
  "¿Eh? ¿Ya terminamos?"
];

const chistes = [
  "¿Qué hace un pez? ¡Nada!",
  "¿Qué le dice un techo a otro? Techo de menos.",
  "¿Qué hace una abeja en el gimnasio? ¡Zum-ba!",
  "¿Cuál es el colmo de un futbolista? Tener un hijo pelota."
];

function getText(message) {
  let msg = message;

  while (msg) {
    if (msg.ephemeralMessage) {
      msg = msg.ephemeralMessage.message;
    } else if (msg.viewOnceMessage) {
      msg = msg.viewOnceMessage.message;
    } else if (msg.viewOnceMessageV2) {
      msg = msg.viewOnceMessageV2.message;
    } else {
      break;
    }
  }

  return (
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    msg?.documentMessage?.caption ||
    ""
  ).trim();
}

async function conectar(numero, res = null) {
  if (connecting) {
    if (res && !res.headersSent) {
      return res.status(429).json({
        error: "El bot ya está intentando conectarse."
      });
    }
    return;
  }

  connecting = true;

  const session = path.join(__dirname, "sessions", numero);

  try {
    fs.mkdirSync(session, { recursive: true });

    const { state, saveCreds } =
      await useMultiFileAuthState(session);

    const { version } = await fetchLatestBaileysVersion();

    const currentSock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      browser: Browsers.ubuntu("Chrome"),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    sock = currentSock;

    currentSock.ev.on("creds.update", saveCreds);

    currentSock.ev.on("connection.update", async ({
      connection,
      lastDisconnect
    }) => {
      if (connection === "open") {
        console.log("♡ Nagi Bot conectado a WhatsApp.");
        connecting = false;
      }

      if (connection === "close") {
        connecting = false;

        const status =
          lastDisconnect?.error?.output?.statusCode;

        console.log("Conexión cerrada:", status);

        if (status !== DisconnectReason.loggedOut) {
          clearTimeout(reconnectTimer);

          reconnectTimer = setTimeout(() => {
            conectar(numero);
          }, 5000);
        } else {
          console.log("Sesión cerrada. Volvé a vincular.");
        }
      }
    });

    if (!state.creds.registered && res) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        const code = await currentSock.requestPairingCode(numero);

        if (!res.headersSent) {
          res.json({
            code: code.match(/.{1,4}/g).join("-")
          });
        }
      } catch (error) {
        connecting = false;
        console.error("Error generando código:", error);

        if (!res.headersSent) {
          res.status(500).json({
            error: "No se pudo generar el código."
          });
        }
      }
    } else if (res && !res.headersSent) {
      res.json({
        message: "La sesión ya está registrada."
      });
    }

    // RECIBIR Y RESPONDER MENSAJES
    currentSock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        try {
          if (!msg.message || msg.key.fromMe) continue;

          const chat = msg.key.remoteJid;

          if (
            !chat ||
            chat === "status@broadcast" ||
            chat.endsWith("@newsletter")
          ) continue;

          const body = getText(msg.message);

          if (!body.startsWith(PREFIX)) continue;

          const parts = body.slice(PREFIX.length).trim().split(/\s+/);

          const command = (parts.shift() || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          const args = parts;

          if (!command) continue;

          console.log(`Comando recibido: ${command} | Chat: ${chat}`);

          const reply = async text => {
            await currentSock.sendMessage(
              chat,
              { text },
              { quoted: msg }
            );
          };

          switch (command) {

            case "menu":
            case "allmenu":
            case "help":
              await reply(menu());
              break;

            case "ping":
              await reply("⚽ ¡Pong! Nagi Bot está activo.");
              break;

            case "owner":
              await reply(
                OWNER
                  ? `♡ Mi creador: https://wa.me/${OWNER.replace(/\D/g, "")}`
                  : "♡ Creador no configurado."
              );
              break;

            case "botinfo":
            case "info":
              await reply(
                `♡ ${BOT_NAME}\n⚽ Prefijo: !\n☁️ Estado: Activo`
              );
              break;

            case "runtime":
              await reply(`☁️ Tiempo activo: ${runtime()}`);
              break;

            case "speed":
              await reply("⚡ Nagi está funcionando.");
              break;

            case "frase":
              await reply(
                "♡ " + frases[Math.floor(Math.random() * frases.length)]
              );
              break;

            case "chiste":
              await reply(
                "♡ " + chistes[Math.floor(Math.random() * chistes.length)]
              );
              break;

            case "dado":
              await reply(
                "🎲 Resultado: " + (Math.floor(Math.random() * 6) + 1)
              );
              break;

            case "moneda":
              await reply(
                "🪙 " + (Math.random() < 0.5 ? "Cara" : "Cruz")
              );
              break;

            case "8ball": {
              const answers = [
                "Sí.",
                "No.",
                "Tal vez.",
                "Definitivamente.",
                "No tengo ganas de responder...",
                "Preguntame después."
              ];

              await reply(
                "🎱 " + answers[Math.floor(Math.random() * answers.length)]
              );
              break;
            }

            case "ppt": {
              const choices = ["piedra", "papel", "tijera"];
              const choice = (args[0] || "").toLowerCase();

              if (!choices.includes(choice)) {
                await reply(
                  "Usá: !ppt piedra, !ppt papel o !ppt tijera"
                );
                break;
              }

              const bot = choices[Math.floor(Math.random() * 3)];

              const result = choice === bot
                ? "¡Empate!"
                : (
                    (choice === "piedra" && bot === "tijera") ||
                    (choice === "papel" && bot === "piedra") ||
                    (choice === "tijera" && bot === "papel")
                  )
                  ? "¡Ganaste!"
                  : "¡Gané yo!";

              await reply(
                `🎮 Vos: ${choice}\nNagi: ${bot}\n${result}`
              );
              break;
            }

            case "ship": {
              const percentage = Math.floor(Math.random() * 101);
              await reply(`♡ Compatibilidad ficticia: ${percentage}%`);
              break;
            }

            case "love":
              await reply("♡ Que nunca te falten motivos para sonreír.");
              break;

            case "amistad":
              await reply("♡ ¡La amistad es una aventura!");
              break;

            case "abrazo":
              await reply("♡ Te mando un abrazo virtual.");
              break;

            case "quiz": {
              const questions = [
                {
                  q: "¿Cuál es el color del cielo despejado?",
                  a: "azul"
                },
                {
                  q: "¿Cuánto es 5 + 5?",
                  a: "10"
                },
                {
                  q: "¿Qué animal dice miau?",
                  a: "gato"
                }
              ];

              const item =
                questions[Math.floor(Math.random() * questions.length)];

              await reply(
                `🧠 𝐐𝐔𝐈𝐙\n\n${item.q}\n\nRespondé: !respuesta ${item.a}`
              );
              break;
            }

            case "report":
              await reply(
                args.length
                  ? "♡ Tu reporte fue recibido."
                  : "Escribí: !report y contame el problema."
              );
              break;

            default:
              await reply(
                `♡ No conozco ese comando.\nUsá ${PREFIX}menu para ver mis comandos.`
              );
          }

        } catch (error) {
          console.error("Error procesando mensaje:", error);
        }
      }
    });

  } catch (error) {
    connecting = false;

    console.error("Error de conexión:", error);

    if (res && !res.headersSent) {
      res.status(500).json({
        error: "No se pudo conectar. Intentá nuevamente."
      });
    }
  }
}

// PÁGINA PARA VINCULAR WHATSAPP
app.get("/", (req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nagi Seishiro Bot</title>
<style>
body {
  background:#0b0b12;
  color:white;
  font-family:sans-serif;
  display:flex;
  justify-content:center;
  align-items:center;
  min-height:90vh;
}
.card {
  background:#191526;
  padding:28px;
  border-radius:18px;
  width:85%;
  max-width:360px;
  text-align:center;
}
input,button {
  width:100%;
  padding:13px;
  margin-top:12px;
  box-sizing:border-box;
  border-radius:9px;
  border:0;
}
input {
  background:#292337;
  color:white;
}
button {
  background:#c7a8ed;
  color:#171020;
  font-weight:bold;
}
#result {
  font-size:25px;
  margin-top:20px;
  overflow-wrap:anywhere;
}
</style>
</head>
<body>
<div class="card">
<h2>ᕬ ᕬ NAGI SEISHIRO</h2>
<p>♡ Vinculá tu WhatsApp con código</p>
<input id="number" placeholder="Número con código de país">
<button onclick="generate()">Generar código</button>
<div id="result"></div>
<p>♡ Nagi Bot 2026</p>
</div>

<script>
async function generate() {
  const number = document.getElementById("number").value.replace(/\\D/g,"");
  const result = document.getElementById("result");

  if (number.length < 8 || number.length > 15) {
    result.innerText = "Número inválido.";
    return;
  }

  result.innerText = "Generando...";

  try {
    const response = await fetch("/generar", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({numero:number})
    });

    const data = await response.json();

    result.innerText = data.code || data.message || data.error;
  } catch(e) {
    result.innerText = "Error de conexión.";
  }
}
</script>
</body>
</html>`);
});

// GENERAR CÓDIGO
app.post("/generar", async (req, res) => {
  const numero = String(req.body.numero || "").replace(/\D/g, "");

  if (numero.length < 8 || numero.length > 15) {
    return res.status(400).json({
      error: "Número inválido. Incluí el código de país."
    });
  }

  await conectar(numero, res);
});

app.listen(PORT, () => {
  console.log(`♡ Nagi Bot activo en el puerto ${PORT}`);
});
