import { SlashCommandBuilder } from "discord.js";

import client from "../../client.js";

export default {
	data: new SlashCommandBuilder().setName("info").setDescription("See a few info about the bot"),
	run: async (interaction) => {
		return await interaction.reply({ embeds: [client.embeds.info] }).catch((err) => client.err(err));
	},
};
