import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { useTimeline } from "discord-player";

export const data = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause the currently playing song");

export async function execute(interaction: CommandInteraction) {
  const timeline = useTimeline();

  if (!timeline) {
    return interaction.reply(
      "This server does not have an active player session."
    );
  }

  const wasPaused = timeline.paused;
  wasPaused ? timeline.resume() : timeline.pause();

  return interaction.reply(
    `The player is now ${wasPaused ? "playing" : "paused"}.`
  );
}
