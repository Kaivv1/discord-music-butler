import {
  EmbedBuilder,
  GuildMember,
  Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { CustomClient } from "../../global.js";
import { QueryType, Track, useMainPlayer } from "discord-player";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Plays a song, sir.")
    .addSubcommand((subcmd) =>
      subcmd
        .setName("song")
        .setDescription("Plays a single song with a URL, sir.")
        .addStringOption((option) =>
          option
            .setName("url")
            .setDescription("The song's URL, sir.")
            .setRequired(true)
        )
    ),
  execute: async (args: { client: CustomClient; interaction: Interaction }) => {
    const { client, interaction } = args;
    if (!interaction.isChatInputCommand()) return;

    const member = interaction.member as GuildMember;
    if (!member.voice.channel) {
      return interaction.reply({
        content: "You need to be in a voice channel, sir.",
      });
    }

    const player = useMainPlayer();

    const queue = player.nodes.create(member.guild.id, {
      metadata: {
        channel: interaction.channel,
        interaction: interaction,
        requestedBy: member.displayName,
        queueCount: 0,
      },
      leaveOnEnd: false,
      leaveOnStop: false,
      leaveOnEmptyCooldown: 5 * 60 * 1000,
    });

    try {
      if (!queue.connection) await queue.connect(member.voice.channel as any);

      if (interaction.options.getSubcommand() === "song") {
        const url = interaction.options.getString("url");

        if (!url) {
          await interaction.reply("No URL provided, sir!");
          return;
        }

        const results = await player.search(url, {
          requestedBy: member.displayName,
          searchEngine: QueryType.AUTO,
        });

        if (!results || !results.hasTracks()) {
          await interaction.reply(
            "No results found, sir. Please don't give me the belt treatment 👀"
          );
          return;
        }

        if (results.queryType === "youtubePlaylist") {
          await interaction.reply(
            "This is a playlist, sir. Please provide a single song URL, not a playlist!"
          );
          return;
        }

        const track: Track = results.tracks[0];

        await queue.addTrack(track);
        queue.metadata.queueCount++;

        const embed = new EmbedBuilder()
          .setTitle(`🎵 ${track.title} added to the queue`)
          .setURL(track.url)
          .addFields({
            name: "Currently in queue",
            value: `${queue.metadata.queueCount}`,
          })
          .setFooter({
            text: `Requested by sir ${queue.metadata.requestedBy}`,
          });

        await interaction.reply({ embeds: [embed] });
      }

      if (!queue.isPlaying()) {
        await queue.node.play();
      }
    } catch (error) {
      if (queue.connection) queue.delete();

      await interaction.reply("An unexpected error occurred, sir.");
    }
  },
};
