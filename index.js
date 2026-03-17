const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { Player, QueryType } = require("discord-player");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
  ],
});

const player = new Player(client);

async function safeReply(interaction, message) {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message);
      return;
    }

    await interaction.reply({ content: message, ephemeral: true });
  } catch (error) {
    console.error("❌ Failed to send interaction response:", error.message);
  }
}

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    await player.scanDeps();
    console.log("✅ discord-player dependencies loaded.");
  } catch (error) {
    console.error("❌ Could not load discord-player dependencies:", error);
  }

  const commands = [
    {
      name: "play",
      description: "Plays a song from YouTube",
      options: [
        {
          name: "query",
          type: 3,
          description: "The song you want to play",
          required: true,
        },
      ],
    },
    { name: "skip", description: "Skips the current song" },
    { name: "queue", description: "Displays the current queue" },
    { name: "stop", description: "Stops the player and clears the queue" },
  ];

  const rest = new REST({ version: "10" }).setToken(config.token);
  try {
    console.log("🔄 Refreshing Slash Commands...");
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, config.guild_id),
      {
        body: commands,
      }
    );
    console.log("✅ Slash Commands Loaded!");
  } catch (error) {
    console.error("❌ Error loading Slash Commands:", error);
  }
});

client.on("error", console.error);
client.on("warn", console.warn);

player.on("error", (queue, error) =>
  console.error(`[Queue Error] ${error.message}`)
);
player.on("connectionError", (queue, error) =>
  console.error(`[Connection Error] ${error.message}`)
);
player.on("trackStart", (queue, track) =>
  queue.metadata.send(`🎶 | Now playing **${track.title}**!`)
);
player.on("trackAdd", (queue, track) =>
  queue.metadata.send(`🎶 | Added **${track.title}** to the queue!`)
);
player.on("botDisconnect", (queue) =>
  queue.metadata.send("❌ | I was manually disconnected. Clearing queue!")
);
player.on("channelEmpty", (queue) =>
  queue.metadata.send("❌ | Nobody is in the voice channel. Leaving...")
);
player.on("queueEnd", (queue) => queue.metadata.send("✅ | Queue finished!"));

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.inGuild()) {
    await safeReply(interaction, "❌ | This command can only be used in a server.");
    return;
  }

  try {
    await interaction.deferReply();

    const queue = player.getQueue(interaction.guildId);

    switch (interaction.commandName) {
      case "play": {
        if (!interaction.member.voice?.channel) {
          await safeReply(
            interaction,
            "❌ | You need to be in a voice channel to use this command!"
          );
          return;
        }

        const query = interaction.options.getString("query", true);

        const searchResult = await player.search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.AUTO,
        });

        if (!searchResult || !searchResult.tracks.length) {
          await safeReply(interaction, "❌ | No results found!");
          return;
        }

        const musicQueue = player.createQueue(interaction.guild, {
          metadata: interaction.channel,
        });

        try {
          if (!musicQueue.connection) {
            await musicQueue.connect(interaction.member.voice.channel);
          }
        } catch {
          player.deleteQueue(interaction.guildId);
          await safeReply(interaction, "❌ | Could not join your voice channel!");
          return;
        }

        await safeReply(
          interaction,
          `⏱ | Loading your ${searchResult.playlist ? "playlist" : "track"}...`
        );

        if (searchResult.playlist) {
          musicQueue.addTracks(searchResult.tracks);
        } else {
          musicQueue.addTrack(searchResult.tracks[0]);
        }

        if (!musicQueue.playing) await musicQueue.play();
        return;
      }

      case "skip": {
        if (!queue || !queue.playing) {
          await safeReply(interaction, "❌ | No music is currently playing!");
          return;
        }

        const currentTrack = queue.current;
        const success = queue.skip();

        await safeReply(
          interaction,
          success
            ? `✅ | Skipped **${currentTrack.title}**!`
            : "❌ | Something went wrong!"
        );
        return;
      }

      case "stop": {
        if (!queue || !queue.playing) {
          await safeReply(interaction, "❌ | No music is currently playing!");
          return;
        }

        queue.destroy();
        await safeReply(interaction, "🛑 | Stopped the player and cleared the queue!");
        return;
      }

      case "queue": {
        if (!queue || !queue.playing) {
          await safeReply(interaction, "❌ | No music is currently playing!");
          return;
        }

        await safeReply(
          interaction,
          `🎵 Queue:\n${queue.tracks.map((t, i) => `${i + 1}. ${t.title}`).join("\n")}`
        );
        return;
      }

      default:
        await safeReply(interaction, "❌ | Unknown command.");
    }
  } catch (error) {
    console.error("❌ Error handling command:", error);
    await safeReply(
      interaction,
      "❌ | I ran into an error while running that command. Check bot logs."
    );
  }
});

client.login(config.token);
