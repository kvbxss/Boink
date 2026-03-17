import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { Player, QueryType } from "discord-player";
import { SpotifyExtractor, SoundCloudExtractor } from "@discord-player/extractor";
import { registerPlayerEvents } from "./events";

const client = new Client({
  intents: [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const player = new Player(client);

await player.extractors.loadMulti([SpotifyExtractor, SoundCloudExtractor]);

await player.extractors.register(SpotifyExtractor, {
  async createStream(extractor, trackUrl) {
    const stream = await extractor.fetchTrack(trackUrl);
    if (!stream) {
      throw new Error("Failed to create a stream from the provided track URL.");
    }
    return stream;
  },
});

client.login(config.token);

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);

  const rest = new REST({ version: "10" }).setToken(config.token);
  try {
    console.log("🔄 Refreshing Slash Commands...");
    await rest.put(
      Routes.applicationGuildCommands(client.user!.id, config.guild_id),
      {
        body: commands,
      }
    );
    console.log("✅ Slash Commands Loaded!");
  } catch (error) {
    console.error("❌ Error loading Slash Commands:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const queue = player.getQueue(interaction.guildId);
  await interaction.deferReply();

  switch (interaction.commandName) {
    case "play": {
      const query = interaction.options.getString("query")!;

      const searchResult = await player.search(query, {
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO,
      });

      if (!searchResult || !searchResult.tracks.length)
        return interaction.followUp("❌ | No results found!");

      const queue = player.createQueue(interaction.guild, {
        metadata: interaction.channel,
      });

      try {
        if (!queue.connection)
          await queue.connect(interaction.member.voice.channel);
      } catch {
        player.deleteQueue(interaction.guildId);
        return interaction.followUp("❌ | Could not join your voice channel!");
      }

      interaction.followUp(
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
        return interaction.followUp("❌ | No music is currently playing!");
      const currentTrack = queue.current;
      const success = queue.skip();
      return interaction.followUp(
        success
          ? `✅ | Skipped **${currentTrack.title}**!`
          : "❌ | Something went wrong!"
      );
    }

    case "stop": {
      if (!queue || !queue.playing)
        return interaction.followUp("❌ | No music is currently playing!");
      queue.destroy();
      return interaction.followUp(
        "🛑 | Stopped the player and cleared the queue!"
      );
    }

    case "queue": {
      if (!queue || !queue.playing)
        return interaction.followUp("❌ | No music is currently playing!");
      return interaction.followUp(
        `🎵 Queue:\n${queue.tracks
          .map((t, i) => `${i + 1}. ${t.title}`)
          .join("\n")}`
      );
    }
  }
});
