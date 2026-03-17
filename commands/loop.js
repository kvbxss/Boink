import { SlashCommandBuilder } from "discord.js";
import { QueueRepeatMode, useQueue } from "discord-player";

export const data = new SlashCommandBuilder()
  .setName("loop")
  .setDescription("Loop the queue in different modes")
  .addNumberOption((option) =>
    option
      .setName("mode")
      .setDescription("The loop mode")
      .setRequired(true)
      .addChoices(
        {
          name: "Off",
          value: QueueRepeatMode.OFF,
        },
        {
          name: "Track",
          value: QueueRepeatMode.TRACK,
        },
        {
          name: "Queue",
          value: QueueRepeatMode.QUEUE,
        },
        {
          name: "Autoplay",
          value: QueueRepeatMode.AUTOPLAY,
        }
      )
  );

export async function execute(interaction) {
  const queue = useQueue();

  if (!queue) {
    return interaction.reply(
      "This server does not have an active player session."
    );
  }

  const loopMode = interaction.options.getNumber("mode");

  queue.setRepeatMode(loopMode);

  return interaction.reply(`Loop mode set to ${QueueRepeatMode[loopMode]}`);
}
