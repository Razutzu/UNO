import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

import client from "../../client.js";
import Game from "../../Classes/game.js";

export default {
	data: new SlashCommandBuilder()
		.setName("create")
		.setDescription("Creates a game")
		.addIntegerOption((option) => option.setName("players").setDescription("The maximum amount of players that can join")),
	run: async (interaction) => {
		if (client.games.get(interaction.channel.id)) return await interaction.reply({ embeds: [client.embeds.gameExists], ephemeral: true }).catch((err) => client.err(err));

		client.games.set(interaction.channel.id, new Game(interaction, interaction.options.getInteger("players") || 10));

		return await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.clr).setDescription(`Game created successfully!`)], ephemeral: true }).catch((err) => client.err(err));
	},
};
