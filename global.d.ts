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
  queue: GuildQueue<{
    channel: TextBasedChannel | null;
    requestedBy: string;
  }>;
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
}
