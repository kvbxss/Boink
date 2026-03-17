import { useMainPlayer } from "discord-player";
import { CommandInteraction } from "discord.js";

const player = useMainPlayer();

const data = {
  guild: interaction.guild,
};

await player.context.provide(data, () => command.execute(interaction));
