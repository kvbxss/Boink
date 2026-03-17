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

client.login(config.token);

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

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

  const queue = player.getQueue(interaction.guildId);

  try {
    await interaction.deferReply();

    switch (interaction.commandName) {
    case "play": {
      if (!interaction.member.voice?.channel)
        return interaction.editReply(
          "❌ | You need to be in a voice channel to use this command!"
        );

      const query = interaction.options.getString("query");

      const searchResult = await player.search(query, {
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO,
      });

      if (!searchResult || !searchResult.tracks.length)
        return interaction.editReply("❌ | No results found!");

      const queue = player.createQueue(interaction.guild, {
        metadata: interaction.channel,
      });

      try {
        if (!queue.connection)
          await queue.connect(interaction.member.voice.channel);
      } catch {
        player.deleteQueue(interaction.guildId);
        return interaction.editReply("❌ | Could not join your voice channel!");
      }

      await interaction.editReply(
        `⏱ | Loading your ${searchResult.playlist ? "playlist" : "track"}...`
      );
      searchResult.playlist
        ? queue.addTracks(searchResult.tracks)
        : queue.addTrack(searchResult.tracks[0]);

      if (!queue.playing) await queue.play();
      break;
    }

    case "skip": {
      if (!queue || !queue.playing)
        return interaction.editReply("❌ | No music is currently playing!");
      const currentTrack = queue.current;
      const success = queue.skip();
      return interaction.editReply(
        success
          ? `✅ | Skipped **${currentTrack.title}**!`
          : "❌ | Something went wrong!"
      );
    }

    case "stop": {
      if (!queue || !queue.playing)
        return interaction.editReply("❌ | No music is currently playing!");
      queue.destroy();
      return interaction.editReply(
        "🛑 | Stopped the player and cleared the queue!"
      );
    }

    case "queue": {
      if (!queue || !queue.playing)
        return interaction.editReply("❌ | No music is currently playing!");
      return interaction.editReply(
        `🎵 Queue:\n${queue.tracks
          .map((t, i) => `${i + 1}. ${t.title}`)
          .join("\n")}`
      );
    }

    default:
      return interaction.editReply("❌ | Unknown command.");
    }
  } catch (error) {
    console.error("❌ Error handling command:", error);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(
        "❌ | I ran into an error while running that command."
      );
      return;
    }

    await interaction.reply({
      content: "❌ | I ran into an error while running that command.",
      ephemeral: true,
    });
  }
});
