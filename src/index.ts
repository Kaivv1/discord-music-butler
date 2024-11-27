import {
  Client,
  DiscordjsError,
  IntentsBitField,
  Collection,
  RESTPostAPIApplicationCommandsJSONBody,
  REST,
  Routes,
} from "discord.js";
import "dotenv/config";
import { Command, CustomClient } from "../global.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MusicPlayer } from "./player.js";

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
  ],
}) as CustomClient;
const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
client.commands = new Collection<
  string,
  RESTPostAPIApplicationCommandsJSONBody
>();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  await import(filePath).then((res) => {
    const command = res.default as Command;
    client.commands.set(command.data.name, res.default);
    commands.push(command.data.toJSON());
  });
}
const customPlayer = new MusicPlayer(client);
customPlayer.initExtractors();
customPlayer.initCurrentSongEvent();
customPlayer.initAddSongEvent();
customPlayer.initAddPlaylistEvent();
customPlayer.initCreateQueueEvent();
customPlayer.initQueueEmptyEvent();
customPlayer.initSongFinishesEvent();
customPlayer.initPlayerErrorEvent();
customPlayer.initErrorEvent();

client.on("ready", () => {
  const guild_ids = client.guilds.cache.map((guild) => guild.id);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);
  for (const guild_id of guild_ids) {
    rest
      .put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, guild_id), {
        body: commands,
      })
      .then(() => console.log(`Added commands to ${guild_id}`))
      .catch((error) => console.log(error));
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(
      interaction.commandName
    ) as unknown as Command;

    if (!command) return;
    try {
      await command.execute({ client, interaction });
    } catch (error) {
      await interaction.reply("Command can't be executed, sir.");
    }
  } else if (interaction.isButton()) {
    const { player } = customPlayer;
    const queue = player.nodes.get(interaction.guild?.id!);

    switch (interaction.customId as CustomId) {
      case "pause":
        if (!queue || !queue.isPlaying())
          return interaction.reply("No music is playing, sir.");
        if (queue.node.isPaused())
          return interaction.reply("Music is already paused, sir.");
        queue.node.pause();
        await interaction.reply(
          "Music is now paused nig ..uhh ..ohh i mean sir. ⏸"
        );
        break;
      case "resume":
        if (!queue)
          return interaction.reply("There are no tracks to resume, sir.");
        if (queue.node.isPlaying())
          return interaction.reply("Music is currently playing, sir.");
        if (queue.node.isPaused()) {
          queue.node.resume();
          await interaction.reply("Music has been resumed, sir. ▶");
        }
        break;
      case "stop":
        if (!queue || !queue.isPlaying())
          return interaction.reply("No music is playing, sir.");
        queue.node.stop(true);
        await interaction.reply(
          "Why you do this, sir. Remember Riri please don't stop the music"
        );
        break;
      case "skip":
        if (!queue || !queue.isPlaying())
          return interaction.reply("No music is playing, sir.");
        if (queue.node.queue.isEmpty())
          return interaction.reply(
            "There are no left tracks in the queue, sir"
          );
        queue.node.skip();
        await interaction.reply("Skipped to next track ⏭");
        break;
      default:
        return interaction.reply("Unknown action");
    }
  } else {
    return;
  }
});

client.on("error", (error) => {
  console.error("An error occurred:", error);
});

client.login(process.env.TOKEN).catch((error: DiscordjsError) => {
  console.log(error.message);
});

export default client;
