import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { useQueue } from "discord-player";

export const data = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("Display the current queue");

export async function execute(interaction: CommandInteraction) {
  const queue = useQueue();

  if (!queue) {
    return interaction.reply(
      "This server does not have an active player session."
    );
  }

  const currentTrack = queue.current;
  const upcomingTracks = queue.tracks.slice(0, 5);

  const message = [
    `**Now Playing:** ${currentTrack.title} - ${currentTrack.author}`,
    "",
    "**Upcoming Tracks:**",
    ...upcomingTracks.map(
      (track, index) => `${index + 1}. ${track.title} - ${track.author}`
    ),
  ].join("\n");

  return interaction.reply(message);
}
