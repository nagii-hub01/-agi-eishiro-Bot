
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers
} from "@whiskeysockets/baileys";

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

let sock;
let connecting = false;
let pairingCode = "";

function runtime() {
  const seconds = Math.floor((Date.now() - START_TIME) / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${h}h ${m}m ${s}s`;
}

function menu() {
  return `ᕬ  ᕬㅤㅤ𝐍𝐀𝐆𝐈   ੭୧   ᮫
⚙️︪੭    𝐒𝐄𝐈𝐒𝐇𝐈𝐑𝐎 ㅤㅤ  ꔫㅤ

❨ ⚽ ❩   𓂂𓂂 𝐌⵿𝖠𝖨𝖭  𝐌𝖤࠘𝖭𝖴 𑊑ㅤׁ🎮ᩨ
•      — ﹫  !menú
•      — ﹫  !owner
•      — ﹫  !ping
•      — ﹫  !botinfo
•      — ﹫  !help
•      — ﹫  !allmenu
•      — ﹫  !runtime
•      — ﹫  !script
•      — ﹫  !speed
•      — ﹫  !report

❨ 🎮 ❩   𓂂𓂂 𝖲𝖳࠘𝖨𝖢𝖪⵿𝖤𝖱𝖲 𝖸 𝖨⵿𝖬𝖠𝖦𝖤𝖭𝖤𝖲 𑊑ㅤׁ⚽ᩨ
•      — ﹫  !sticker
•      — ﹫  !s
•      — ﹫  !toimg
•      — ﹫  !take
•      — ﹫  !emojimix
•      — ﹫  !qc
•      — ﹫  !wanted
•      — ﹫  !blur
•      — ﹫  !circle
•      — ﹫  !trigger

❨ ⚽ ❩   𓂂𓂂  𝐆𝖱𝖮⵿𝖴𝖯 𝐆𝖠𝖬𝖤𝖲 𑊑ㅤׁ🎮ᩨ
•      — ﹫  !ppt
•      — ﹫  !trivia
•      — ﹫  !adivina
•      — ﹫  !verdad
•      — ﹫  !reto
•      — ﹫  !quiz
•      — ﹫  !riddle
•      — ﹫  !adivinanza
•      — ﹫  !numeros
•      — ﹫  !memoria

❨ 🎮 ❩   𓂂𓂂  𝖲𝖮𝖢𝖨𝖠𝖫 𑊑ㅤׁ⚽ᩨ
•      — ﹫  !perfil
•      — ﹫  !rank
•      — ﹫  !top
•      — ﹫  !ship
•      — ﹫  !compatibilidad
•      — ﹫  !crush
•      — ﹫  !amistad
•      — ﹫  !love
•      — ﹫  !abrazo
•      — ﹫  !beso

❨ ⚽ ❩   𓂂𓂂  𝐅𝖴𝖭 𝐂𝖮𝖬𝖬𝖠𝖭𝖣𝖲 𑊑ㅤׁ🎮ᩨ
•      — ﹫  !chiste
•      — ﹫  !frase
•      — ﹫  !consejo
•      — ﹫  !meme
•      — ﹫  !dado
•      — ﹫  !moneda
•      — ﹫  !8ball
•      — ﹫  !fact
•      — ﹫  !motivacion
•      — ﹫  !insulto

❨ 🎮 ❩   𓂂𓂂  𝐆𝖱𝖮𝖴𝖯 𝐀𝖣𝖬𝖨𝖭 𑊑ㅤׁ⚽ᩨ
•      — ﹫  !kick
•      — ﹫  !add
•      — ﹫  !promote
•      — ﹫  !demote
•      — ﹫  !tagall
•      — ﹫  !hidetag
•      — ﹫  !admins
•      — ﹫  !infogrupo
•      — ﹫  !antilink
•      — ﹫  !delete

❨ ⚽ ❩   𓂂𓂂  𝐃𝖮𝖶𝖭𝖫𝖮𝖠𝖣𝖲 𑊑ㅤׁ🎮ᩨ
•      — ﹫  !play
•      — ﹫  !video
•      — ﹫  !audio
•      — ﹫  !pinterest
•      — ﹫  !image
•      — ﹫  !google
•      — ﹫  !tiktok
•      — ﹫  !instagram
•      — ﹫  !facebook
•      — ﹫  !twitter

❨ 🎮 ❩   𓂂𓂂  𝐓𝖮𝖮𝖫𝖲 𑊑ㅤׁ⚽ᩨ
•      — ﹫  !translate
•      — ﹫  !wikipedia
•      — ﹫  !weather
•      — ﹫  !define
•      — ﹫  !calculate
•      — ﹫  !shorturl
•      — ﹫  !qr
•      — ﹫  !readqr
•      — ﹫  !tts
•      — ﹫  !dictionary

❨ ⚽ ❩   𓂂𓂂  𝐁𝖮𝖳 𝐒𝖤𝖳𝖳𝖨𝖭𝖦𝖲 𑊑ㅤׁ🎮ᩨ
•      — ﹫  !setprefix
•      — ﹫  !welcome
•      — ﹫  !goodbye
•      — ﹫  !antilink
•      — ﹫  !antispam
•      — ﹫  !autosticker
•      — ﹫  !autoread
•      — ﹫  !mode
•      — ﹫  !enable
•      — ﹫  !disable

ㅤㅤㅤㅤ  𓂂𓂂 𝐍𝐀𝐆𝐈 𝐒𝐄𝐈𝐒𝐇𝐈𝐑𝐎
ㅤㅤㅤㅤㅤㅤ  𖹭 𝐁𝐎𝐓 𖹭`;
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

const consejos = [
  "No te apresures. Todo llega a su tiempo.",
  "Descansar también es importante.",
  "No dejes que un mal día arruine toda tu semana."
];

async function conectar(numero, res = null) {
  if (connecting) {
    if (res && !res.headersSent) {
      res.status(429).json({
        error: "Ya hay una conexión en proceso."
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

    const socket = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      browser: Browsers.ubuntu("Chrome"),
      printQRInTerminal: false,
      syncFullHistory: false
    });

    sock = socket;

    socket.ev.on("creds.update", saveCreds);

    if (!socket.authState.creds.registered && res) {
      setTimeout(async () => {
        try {
          if (res.headersSent) return;

          const code = await socket.requestPairingCode(numero);

          pairingCode = code.match(/.{1,4}/g).join("-");

          if (!res.headersSent) {
            res.json({ code: pairingCode });
          }
        } catch (error) {
          connecting = false;
          console.error("Error pidiendo código:", error);

          if (!res.headersSent) {
            res.status(500).json({
              error: "Error al generar el código. Probá de nuevo."
            });
          }
        }
      }, 3000);
    } else if (res && !res.headersSent) {
      res.json({ message: "La sesión ya está registrada." });
    }

    socket.ev.on("connection.update", ({ connection, lastDisconnect }) => {
      if (connection === "open") {
        console.log("Nagi Bot conectado correctamente.");
        connecting = false;
      }

      if (connection === "close") {
        connecting = false;

        const status = lastDisconnect?.error?.output?.statusCode;

        if (status !== DisconnectReason.loggedOut) {
          console.log("Conexión cerrada. Intentando reconectar...");

          setTimeout(() => conectar(numero), 5000);
        } else {
          console.log("Sesión cerrada. Volvé a vincular el bot.");
        }
      }
    });

    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        try {
          if (!msg.message || msg.key.fromMe) continue;

          const chat = msg.key.remoteJid;

          if (!chat || chat === "status@broadcast") continue;

          const sender = msg.key.participant || chat;

          const text = (
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            ""
          ).trim();

          if (!text.startsWith(PREFIX)) continue;

          const args = text.slice(PREFIX.length).trim().split(/\s+/);
          const command = (args.shift() || "").toLowerCase();

          const reply = (message) =>
            socket.sendMessage(chat, { text: message }, { quoted: msg });

          const isGroup = chat.endsWith("@g.us");

          const metadata = isGroup
            ? await socket.groupMetadata(chat)
            : null;

          const admins = metadata
            ? metadata.participants
                .filter(p => p.admin)
                .map(p => p.id)
            : [];

          const isAdmin = admins.includes(sender);

          const isOwner = OWNER &&
            sender.replace(/\D/g, "").endsWith(
              OWNER.replace(/\D/g, "")
            );

          const target =
            msg.message.extendedTextMessage?.contextInfo?.participant ||
            msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          switch (command) {
            case "menu":
            case "menú":
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
                  ? `♡ Mi creador: wa.me/${OWNER.replace(/\D/g, "")}`
                  : "♡ Creador no configurado."
              );
              break;

            case "botinfo":
            case "info":
              await reply(
                `♡ ${BOT_NAME}\n⚽ Prefijo: ${PREFIX}\n☁️ Estado: Activo`
              );
              break;

            case "runtime":
              await reply(`☁️ Tiempo activo: ${runtime()}`);
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

            case "consejo":
              await reply(
                "♡ " + consejos[Math.floor(Math.random() * consejos.length)]
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

            case "ship":
            case "compatibilidad":
              await reply(
                `♡ Compatibilidad ficticia: ${Math.floor(Math.random() * 101)}%`
              );
              break;

            case "love":
              await reply("♡ Que nunca te falten motivos para sonreír.");
              break;

            case "amistad":
              await reply("♡ ¡La amistad también es una aventura!");
              break;

            case "abrazo":
              await reply("♡ Nagi te manda un abrazo.");
              break;

            case "beso":
              await reply("♡ Nagi te envía un besito.");
              break;

            case "crush":
              await reply("♡ Tu crush quizá está pensando en vos.");
              break;

            case "adivina": {
              const number = Math.floor(Math.random() * 10) + 1;
              await reply(
                `🎮 Adiviná un número del 1 al 10.\nPista: ${number}`
              );
              break;
            }

            case "trivia":
            case "quiz":
              await reply(
                "⚽ Pregunta: ¿Cómo se llama el protagonista de Blue Lock?\n\nA) Isagi\nB) Nagi\nC) Bachira"
              );
              break;

            case "verdad":
              await reply("♡ ¿Cuál es tu mayor sueño?");
              break;

            case "reto":
              await reply("♡ Reto: contá algo divertido sobre vos.");
              break;

            case "numeros":
              await reply(
                "🎮 " + (Math.floor(Math.random() * 100) + 1)
              );
              break;

            case "memoria":
              await reply("♡ Recordá estos números: 2 - 7 - 4 - 9");
              break;

            case "perfil":
              await reply(
                `♡ PERFIL\nNombre: ${msg.pushName || "Usuario"}\nEstado: Jugador`
              );
              break;

            case "rank":
            case "top":
              await reply("🏆 Todavía no hay un ranking disponible.");
              break;

            case "admins":
              if (!metadata) {
                await reply("Este comando solo funciona en grupos.");
                break;
              }

              await reply(
                "♡ Administradores:\n" +
                admins.map(id => "@" + id.split("@")[0]).join("\n"),
              );
              break;

            case "infogrupo":
              if (!metadata) {
                await reply("Este comando solo funciona en grupos.");
                break;
              }

              await reply(
                `♡ ${metadata.subject}\n👥 Miembros: ${metadata.participants.length}\n📝 ${metadata.desc || "Sin descripción"}`
              );
              break;

            case "tagall":
            case "hidetag":
              if (!isGroup) {
                await reply("Este comando solo funciona en grupos.");
                break;
              }

              if (!isAdmin && !isOwner) {
                await reply("Solo los administradores pueden usarlo.");
                break;
              }

              await socket.sendMessage(chat, {
                text: args.join(" ") || "♡ Atención a todos.",
                mentions: metadata.participants.map(p => p.id)
              });
              break;

            case "kick":
            case "add":
            case "promote":
            case "demote": {
              if (!isGroup) {
                await reply("Este comando solo funciona en grupos.");
                break;
              }

              if (!isAdmin && !isOwner) {
                await reply("Solo los administradores pueden usarlo.");
                break;
              }

              if (!target) {
                await reply("Respondé al mensaje o mencioná a un usuario.");
                break;
              }

              if (command === "kick") {
                await socket.groupParticipantsUpdate(chat, [target], "remove");
              } else if (command === "add") {
                await reply("La incorporación debe hacerse respetando la invitación y las opciones de privacidad del usuario.");
              } else if (command === "promote") {
                await socket.groupParticipantsUpdate(chat, [target], "promote");
              } else {
                await socket.groupParticipantsUpdate(chat, [target], "demote");
              }

              if (command !== "add") {
                await reply("♡ Acción realizada.");
              }
              break;
            }

            case "delete":
              if (!isGroup) {
                await reply("Este comando solo funciona en grupos.");
                break;
              }

              if (!isAdmin && !isOwner) {
                await reply("Solo los administradores pueden usarlo.");
                break;
              }

              if (!msg.message.extendedTextMessage?.contextInfo?.stanzaId) {
                await reply("Respondé al mensaje que querés eliminar.");
                break;
              }

              await socket.sendMessage(chat, {
                delete: {
                  remoteJid: chat,
                  fromMe: false,
                  id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                  participant: target
                }
              });
              break;

            case "speed":
              await reply("⚡ Nagi Bot está funcionando.");
              break;

            case "script":
              await reply("♡ Nagi Seishiro Bot.");
              break;

            case "report":
              await reply("♡ Gracias por tu reporte. Contactá al creador del bot.");
              break;

            case "riddle":
            case "adivinanza":
              await reply("♡ ¿Qué tiene agujas pero no cose? ¡Un reloj!");
              break;

            default:
              await reply(
                "Ese comando todavía no está disponible. Usa !menu"
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

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">

    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">

      <title>Nagi Seishiro Bot</title>

      <style>
        * {
          box-sizing: border-box;
        }

        body {
          background: #0b0b12;
          color: white;
          font-family: sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 90vh;
          margin: 0;
        }

        .card {
          background: #191526;
          padding: 28px;
          border-radius: 18px;
          width: 85%;
          max-width: 360px;
          text-align: center;
          box-shadow: 0 0 25px #c7a8ed22;
        }

        input, button {
          width: 100%;
          padding: 13px;
          margin-top: 12px;
          border-radius: 9px;
          border: 0;
        }

        input {
          background: #292337;
          color: white;
        }

        button {
          background: #c7a8ed;
          color: #171020;
          font-weight: bold;
          cursor: pointer;
        }

        #result {
          font-size: 22px;
          margin-top: 20px;
          overflow-wrap: anywhere;
        }
      </style>
    </head>

    <body>
      <div class="card">
        <h2>ᕬ ᕬ NAGI SEISHIRO</h2>

        <p>♡ Vinculá tu WhatsApp con código</p>

        <input
          id="number"
          type="tel"
          placeholder="Número con código de país"
        >

        <button onclick="generate()">
          Generar código
        </button>

        <div id="result"></div>

        <p>♡ Nagi Bot 2026</p>
      </div>

      <script>
        async function generate() {
          const number = document
            .getElementById("number")
            .value.replace(/\\D/g, "");

          const result = document.getElementById("result");

          if (number.length < 8 || number.length > 15) {
            result.innerText = "Número inválido.";
            return;
          }

          result.innerText = "Generando código...";

          try {
            const response = await fetch("/generar", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                numero: number
              })
            });

            const data = await response.json();

            result.innerText = data.code || data.message || data.error;

          } catch (error) {
            result.innerText = "Error de conexión.";
          }
        }
      </script>
    </body>

    </html>
  `);
});

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
  console.log(`Nagi Bot activo en el puerto ${PORT}`);
});
