import { Player } from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { CustomClient } from "../global.js";

export class MusicPlayer implements CustomPlayer {
  player: Player;

  constructor(client: CustomClient) {
    this.player = new Player(client as any);
    this.initExtractors = this.initExtractors.bind(this);
    this.initCurrentSongEvent = this.initCurrentSongEvent.bind(this);
    this.initAddSongEvent = this.initAddSongEvent.bind(this);
    this.initAddPlaylistEvent = this.initAddPlaylistEvent.bind(this);
    this.initSongFinishesEvent = this.initSongFinishesEvent.bind(this);
    this.initCreateQueueEvent = this.initCreateQueueEvent.bind(this);
    this.initQueueEmptyEvent = this.initQueueEmptyEvent.bind(this);
    this.initPlayerErrorEvent = this.initPlayerErrorEvent.bind(this);
    this.initErrorEvent = this.initErrorEvent.bind(this);
  }

  async initExtractors() {
    await this.player.extractors.loadDefault(
      (ext) => ext !== "YouTubeExtractor"
    );
    await this.player.extractors.register(YoutubeiExtractor, {});
  }

  initCurrentSongEvent() {
    this.player.events.on("playerStart", async (queue, track) => {
      const channel = queue.metadata.channel;
      if (!channel) return;
      const interaction = queue.metadata
        .interaction as ChatInputCommandInteraction<CacheType>;
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

      const embed = new EmbedBuilder();

      embed
        .setTitle(`💿 Currently playing ${track?.title}`)
        .setURL(track?.url)
        .setAuthor({ name: `Added by sir ${queue.metadata.requestedBy}` })
        .setThumbnail(track.thumbnail || "")
        .addFields(
          { name: "Duration", value: track?.duration, inline: true },
          { name: "Artist", value: track?.author, inline: true }
        )
        .setTimestamp();

      if (queue.metadata.nowPlayingMsg) {
        queue.metadata.nowPlayingMsg = null;
        console.log("Failed to delete old playing message at current song");
      }

      const nowPlayingMsg = await interaction.followUp({
        embeds: [embed],
        components: [buttons],
      });

      queue.metadata.nowPlayingMsg = nowPlayingMsg;
    });
  }

  initAddSongEvent() {
    this.player.events.on("audioTrackAdd", async (queue, track) => {
      const channel = queue.metadata.channel;
      if (!channel) return;
      // queue.metadata.queueCount++;

      // const interaction = queue.metadata
      //   .interaction as ChatInputCommandInteraction<CacheType>;

      // const embed = new EmbedBuilder()
      //   .setTitle(`🎵 ${track.title} added to the queue`)
      //   .setURL(track.url)
      //   .addFields({
      //     name: "Currently in queue",
      //     value: `${queue.metadata.queueCount}`,
      //   })
      //   .setFooter({ text: `Requested by sir ${queue.metadata.requestedBy}` });

      // await interaction.followUp({ embeds: [embed] });
    });
  }

  initAddPlaylistEvent() {
    this.player.events.on("audioTracksAdd", async (queue, track) => {
      const channel = queue.metadata.channel;
      if (!channel) return;
    });
  }

  initCreateQueueEvent() {
    this.player.events.on("queueCreate", (queue) => {
      const channel = queue.metadata.channel;
      if (!channel) return;
      queue.metadata.queueCount = 0;
    });
  }

  initQueueEmptyEvent() {
    this.player.events.on("emptyQueue", async (queue) => {
      const channel = queue.metadata.channel;
      if (!channel) return;
      const embed = new EmbedBuilder()
        .setTitle("Empty queue, gents")
        .setDescription(
          "Keep the party going nig ..ahhh ..umm sirs and add more songs."
        );

      if (queue.metadata.nowPlayingMsg) {
        try {
          await queue.metadata.nowPlayingMsg.delete();
          console.log("buttons deleted");
          queue.metadata.nowPlayingMsg = null;
        } catch (error) {
          console.log("Failed to delete old playing message at empty queue");
        }
      }

      await queue.channel?.send({ embeds: [embed] });
    });
  }

  initSongFinishesEvent() {
    this.player.events.on("playerFinish", async (queue, track) => {
      const channel = queue.metadata.channel;
      if (!channel) return;
      queue.metadata.queueCount = Math.max(0, queue.metadata.queueCount - 1);

      if (queue.metadata.nowPlayingMsg) {
        try {
          await queue.metadata.nowPlayingMsg.delete();
          console.log("buttons deleted");
          queue.metadata.nowPlayingMsg = null;
        } catch (error) {
          console.log(
            "Failed to delete old playing message at player finish",
            error
          );
        }
      }
    });
  }

  initPlayerErrorEvent() {
    this.player.events.on("playerError", async (queue) => {
      if (queue.metadata.nowPlayingMsg) {
        try {
          await queue.metadata.nowPlayingMsg.delete();
          console.log("buttons deleted");
          queue.metadata.nowPlayingMsg = null;
        } catch (error) {
          console.log(
            "Failed to delete old playing message at player error",
            error
          );
        }
      }
      await queue.channel?.send("Could not play this song, sir.");
    });
  }

  initErrorEvent() {
    this.player.events.on("error", async (queue) => {
      if (queue.metadata.nowPlayingMsg) {
        try {
          await queue.metadata.nowPlayingMsg.delete();
          console.log("buttons deleted");
          queue.metadata.nowPlayingMsg = null;
        } catch (error) {
          console.log("Failed to delete old playing message at error", error);
        }
      }
      await queue.channel?.send("Could not play this song, sir.");
    });
  }
}
