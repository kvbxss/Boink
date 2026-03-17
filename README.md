# Boink - The Ultimate Discord Music Bot 🎵

![Boink Logo](bee.png)

**Boink** is a Discord music bot with slash commands (`/play`, `/skip`, `/queue`, `/stop`).

## Features 🚀
- **Crystal Clear Audio** 🎶
- **Fast and Reliable** ⚡
- **Intuitive Slash Commands** 🛠️
- **Queue System** 📜

## Commands 📝
| Command | Description |
|---|---|
| `/play [query]` | Play a song from YouTube/search |
| `/skip` | Skip the current song |
| `/queue` | View the current queue |
| `/stop` | Stop playback and clear queue |

---

## Run Boink in your own Discord server (step-by-step)

### 1) Create a Discord application + bot
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and name it (e.g. `Boink`).
3. Open the app, go to **Bot** tab, then click **Add Bot**.
4. Under **Privileged Gateway Intents**, enable:
   - **SERVER MEMBERS INTENT** (optional)
   - **MESSAGE CONTENT INTENT** (not required for slash commands, but commonly enabled)

> Boink needs at least normal **Guilds** and **Voice State** access (already requested in code).

### 2) Invite the bot to your server
In **OAuth2 → URL Generator**:
- Scopes:
  - `bot`
  - `applications.commands`
- Bot Permissions:
  - `Connect`
  - `Speak`
  - `View Channel`
  - `Send Messages`

Open the generated URL and invite the bot to your target server.

### 3) Get required IDs and token
- **Bot token**: Developer Portal → Bot → **Reset Token** / **Copy**
- **Guild (server) ID**:
  1. Discord User Settings → Advanced → enable **Developer Mode**
  2. Right-click your server → **Copy Server ID**

### 4) Configure this project
1. Install Node dependencies:
   ```bash
   npm install
   ```
2. Create your config file from template:
   ```bash
   cp config.-template.json config.json
   ```
3. Edit `config.json`:
   ```json
   {
     "prefix": "/",
     "token": "YOUR_DISCORD_BOT_TOKEN_HERE",
     "guild_id": "YOUR_SERVER_ID_HERE"
   }
   ```

### 5) Start the bot
```bash
node index.js
```

If setup is correct, you should see logs like:
- `✅ Logged in as ...`
- `✅ Slash Commands Loaded!`

### 6) Test in Discord
1. Join a voice channel in your server.
2. Run:
   - `/play never gonna give you up`
   - `/queue`
   - `/skip`
   - `/stop`

---

## Common issues / fixes

### Slash commands do not appear
- Make sure `guild_id` in `config.json` matches the server where you invited the bot.
- Re-run `node index.js` so slash commands are re-registered.
- Confirm bot was invited with `applications.commands` scope.

### Bot joins but no audio
- Verify bot has **Connect** + **Speak** permissions in that voice channel.
- Ensure your host machine has FFmpeg available.

### "Could not join your voice channel"
- The user running `/play` must already be in a voice channel.
- Check channel permission overrides for the bot role.

---

## Development
```bash
node --check index.js
```

## License
Open-source project; modify and improve freely.
