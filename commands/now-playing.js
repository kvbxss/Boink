import { SlashCommandBuilder } from "discord.js";
import { useQueue } from "discord-player";

export const data = new SlashCommandBuilder()
  .setName("nowplaying")
  .setDescription("Display the currently playing song");

export async function execute(interaction) {
  const queue = useQueue();

  if (!queue) {
    return interaction.reply(
      "This server does not have an active player session."
    );
  }

  const currentSong = queue.currentTrack;

  if (!currentSong) {
    return interaction.reply("No song is currently playing.");
  }

  return interaction.reply(`Now playing: ${currentSong.name}`);
}
