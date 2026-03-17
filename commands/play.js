import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import { useMainPlayer } from "discord-player";

export const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play a song in your voice channel")
  .addStringOption((option) =>
    option.setName("song").setDescription("The song to play").setRequired(true)
  );

export async function execute(interaction) {
  const player = useMainPlayer();

  const query = interaction.options.getString("song", true);

  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    return interaction.reply(
      "You need to be in a voice channel to play music!"
    );
  }

  if (
    interaction.guild.members.me.voice.channel &&
    interaction.guild.members.me.voice.channel !== voiceChannel
  ) {
    return interaction.reply(
      "I am already playing in a different voice channel!"
    );
  }

  if (
    !interaction.guild.members.me.permissions.has(
      PermissionsBitField.Flags.Connect
    )
  ) {
    return interaction.reply(
      "I do not have permissions to join your voice channel!"
    );
  }

  if (
    !interaction.guild.members.me
      .permissionsIn(voiceChannel)
      .has(PermissionsBitField.Flags.Speak)
  ) {
    return interaction.reply(
      "I do not have permission to speak in your voice channel!"
    );
  }

  try {
    const result = await player.play(voiceChannel, query, {
      nodeOptions: {
        metadata: { channel: interaction.channel },
      },
    });

    return interaction.reply(
      `${result.track.title} has been added to the queue!`
    );
  } catch (error) {
    console.error(error);
    return interaction.reply("An error occured while playing the song!");
  }
}
