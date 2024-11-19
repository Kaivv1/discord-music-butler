import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  Interaction,
  MessageActionRowComponentBuilder,
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
  execute: async ({
    client,
    interaction,
  }: {
    client: CustomClient;
    interaction: Interaction;
  }) => {
    if (!interaction.isChatInputCommand()) return;

    const member = interaction.member as GuildMember;
    if (!member.voice.channel) {
      return interaction.reply("You need to be in a voice channel, sir.");
    }

    const player = useMainPlayer();

    const queue = player.nodes.create(member.guild.id, {
      metadata: {
        channel: interaction.channel,
        requestedBy: member.displayName,
      },
      leaveOnEmptyCooldown: 5 * 60 * 1000,
    });
    client.queue = queue;
    const embed = new EmbedBuilder();
    try {
      if (!queue.connection) await queue.connect(member.voice.channel as any);
      await interaction.deferReply();

      if (interaction.options.getSubcommand() === "song") {
        const url = interaction.options.getString("url");

        if (!url) {
          return interaction.followUp("No URL provided, sir!");
        }

        const results = await player.search(url, {
          requestedBy: member.displayName,
          searchEngine: QueryType.AUTO,
        });

        if (results.queryType === "youtubePlaylist") {
          return await interaction.followUp(
            "This is a playlist, sir. Please provide a single song URL, not a playlist!"
          );
        }

        if (!results || !results.hasTracks()) {
          return await interaction.followUp(
            "No results found, sir. Please don't give me the belt treatment 👀"
          );
        }

        const track: Track = results.tracks[0];

        await queue.addTrack(track);

        embed
          .setTitle(track?.title)
          .setURL(track?.url)
          .setAuthor({ name: `Requested by sir ${member.displayName}` })
          .setThumbnail(track.thumbnail || "")
          .addFields(
            { name: "Duration", value: track?.duration, inline: true },
            { name: "Artist", value: track?.author, inline: true }
          )
          .setTimestamp();
      }
    } catch (error) {
      if (queue.connection) queue.delete();

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply("An unexpected error occurred, sir.");
      }
    }

    const buttons =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("resume")
          .setLabel("Resume")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("pause")
          .setLabel("Pause")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("skip")
          .setLabel("Skip")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("stop")
          .setLabel("Stop")
          .setStyle(ButtonStyle.Primary)
      );

    if (!queue.isPlaying()) {
      await queue.node.play();
    }

    if (!interaction.replied) {
      await interaction.followUp({ embeds: [embed], components: [buttons] });
    }
  },
};
