require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Client, GatewayIntentBits, Events } = require("discord.js");

const app = express();
const PORT = process.env.PORT || 3000;
const PROFILE_ID = "1243400658984632320";

app.use(cors());
app.use(express.json());

const FRIEND_IDS = [
  "740987243250057325",
  "997865025698009170",
  "1401747099409711175",
  "1350457070972829810",
  "1364594710517383239",
  "1170758007014047745",
  "1189565390142062634",
  "1282114525730045977"
];

let discordReady = false;

const cache = {
  friends: null,
  friendsExpiresAt: 0,
  profile: null,
  profileExpiresAt: 0
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function fallbackAvatar(seed) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}&backgroundColor=111111`;
}

async function getProfile() {
  const now = Date.now();

  if (cache.profile && now < cache.profileExpiresAt) {
    return cache.profile;
  }

  if (!discordReady) {
    return {
      id: PROFILE_ID,
      username: "onyxbs",
      globalName: "OnyxBS",
      avatar: fallbackAvatar("OnyxBS"),
      profile: `https://discord.com/users/${PROFILE_ID}`,
      discordReady: false
    };
  }

  try {
    const user = await client.users.fetch(PROFILE_ID, { force: true });

    const profile = {
      id: user.id,
      username: user.username,
      globalName: user.globalName || "OnyxBS",
      avatar: user.displayAvatarURL({ size: 512, extension: "png" }),
      profile: `https://discord.com/users/${user.id}`,
      discordReady: true
    };

    cache.profile = profile;
    cache.profileExpiresAt = now + 1000 * 60 * 30;

    return profile;
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);

    return {
      id: PROFILE_ID,
      username: "onyxbs",
      globalName: "OnyxBS",
      avatar: fallbackAvatar("OnyxBS"),
      profile: `https://discord.com/users/${PROFILE_ID}`,
      discordReady: false
    };
  }
}

async function getFriends() {
  const now = Date.now();

  if (cache.friends && now < cache.friendsExpiresAt) {
    return cache.friends;
  }

  if (!discordReady) {
    return FRIEND_IDS.map((id) => ({
      id,
      username: "Carregando",
      globalName: "Carregando",
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${id}&backgroundColor=111111&textColor=ffffff`,
      profile: `https://discord.com/users/${id}`,
      status: "offline"
    }));
  }

  const friends = await Promise.all(
    FRIEND_IDS.map(async (id) => {
      try {
        const user = await client.users.fetch(id, { force: true });

        return {
          id: user.id,
          username: user.username,
          globalName: user.globalName || user.username,
          avatar: user.displayAvatarURL({ size: 256, extension: "png" }),
          profile: `https://discord.com/users/${user.id}`,
          status: "online"
        };
      } catch (error) {
        console.error(`Erro ao buscar amigo ${id}:`, error);

        return {
          id,
          username: "Amigo",
          globalName: "Amigo",
          avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${id}&backgroundColor=111111&textColor=ffffff`,
          profile: `https://discord.com/users/${id}`,
          status: "offline"
        };
      }
    })
  );

  cache.friends = friends;
  cache.friendsExpiresAt = now + 1000 * 60 * 30;

  return friends;
}

app.get("/", (req, res) => {
  res.json({
    online: true,
    name: "OnyxBS Bio API",
    discordReady,
    routes: ["/health", "/api/profile", "/api/friends"]
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    discordReady,
    uptime: process.uptime()
  });
});

app.get("/api/profile", async (req, res) => {
  try {
    res.json(await getProfile());
  } catch (error) {
    console.error("Erro em /api/profile:", error);
    res.status(500).json({ error: "Erro ao buscar perfil." });
  }
});

app.get("/api/friends", async (req, res) => {
  try {
    res.json(await getFriends());
  } catch (error) {
    console.error("Erro em /api/friends:", error);
    res.status(500).json({ error: "Erro ao buscar amigos." });
  }
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

client.once(Events.ClientReady, () => {
  discordReady = true;
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("error", (error) => {
  console.error("Erro do Discord:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

const token = process.env.DISCORD_BOT_TOKEN;

if (!token || token === "COLOQUE_SEU_TOKEN_AQUI") {
  console.error("DISCORD_BOT_TOKEN não configurado.");
} else {
  console.log("Token encontrado, tentando conectar ao Discord...");

  client.login(token)
    .then(() => {
      console.log("Login enviado ao Discord.");
    })
    .catch((error) => {
      discordReady = false;
      console.error("Erro ao fazer login no Discord:");
      console.error(error);
    });
}