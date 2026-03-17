import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { useQueue } from "discord-player";

export const data = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffle the tracks in the queue");

export async function execute(interaction: CommandInteraction) {
  const queue = useQueue();

  if (!queue) {
    return interaction.reply(
      "This server does not have an active player session."
    );
  }

  if (queue.tracks.size < 2) {
    return interaction.reply(
      "There are not enough tracks in the queue to shuffle."
    );
  }

  queue.tracks.shuffle();
  return interaction.reply(`Shuffled ${queue.tracks.size} tracks.`);
}
