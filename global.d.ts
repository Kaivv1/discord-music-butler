import { Player } from "discord-player";
import {
  Client,
  Collection,
  Interaction,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
} from "discord.js";

export interface CustomClient extends Client {
  commands: Collection<string, RESTPostAPIApplicationCommandsJSONBody>;
}

export interface Command extends RESTPostAPIApplicationCommandsJSONBody {
  data: SlashCommandBuilder;
  execute: ({
    interaction,
    client,
  }: {
    interaction: Interaction;
    client: CustomClient;
  }) => void;
}

global {
  type CustomId = "resume" | "stop" | "skip" | "pause";

  interface CustomPlayer {
    initExtractors: () => void;
    initCurrentSongEvent: () => void;
    initAddSongEvent: () => void;
    initQueueEmptyEvent: () => void;
    initCreateQueueEvent: () => void;
    initAddPlaylistEvent: () => void;
    initPlayerErrorEvent: () => void;
    initErrorEvent: () => void;
  }
}
