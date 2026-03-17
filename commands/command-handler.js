import { useMainPlayer } from "discord-player";

const player = useMainPlayer();

const data = {
  guild: interaction.guild,
};

await player.context.provide(data, () => command.execute(interaction));
