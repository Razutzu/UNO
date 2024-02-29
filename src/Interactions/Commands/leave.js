import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

import client from "../../client.js";

export default {
	data: new SlashCommandBuilder().setName("leave").setDescription("Leave the game"),
	run: async (interaction) => {
		const game = client.games.get(interaction.channel.id);
		if (!game) return await interaction.reply({ embeds: [client.embeds.noGame], ephemeral: true }).catch((err) => client.err(err));

		const user = game.getUser(interaction.user.id);
		if (!user) return await interaction.reply({ embeds: [client.embeds.notJoined], ephemeral: true }).catch((err) => client.err(err));

		await user.leave();
	},
};
