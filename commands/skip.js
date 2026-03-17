import { SlashCommandBuilder } from "discord.js";
import { useQueue } from "discord-player";

export const data = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip the currently playing song");

export async function execute(interaction) {
  const queue = useQueue();

  if (!queue) {
    return interaction.reply(
      "This server does not have an active player session."
    );
  }

  if (!queue.isPlaying()) {
    return interaction.reply("There is no track playing.");
  }

  queue.node.skip();

  return interaction.reply("The current song has been skipped.");
}
