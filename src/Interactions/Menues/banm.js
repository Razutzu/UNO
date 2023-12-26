import client from "../../client.js";

export default {
	run: async (interaction) => {
		const game = client.games.get(interaction.channel.id);
		if (!game) return await interaction.reply({ embeds: [client.embeds.noGame], ephemeral: true }).catch((err) => client.err(err));

		const user = game.getUser(interaction.user.id);
		if (!user) return await interaction.reply({ embeds: [client.embeds.notJoined], ephemeral: true }).catch((err) => client.err(err));

		if (!user.host) return await interaction.reply({ embeds: [client.embeds.notHost], ephemeral: true }).catch((err) => client.err(err));

		const banUser = game.getUser(interaction.values[0]);
		if (!banUser) return await interaction.reply({ embeds: [client.embeds.notJoinedSecond], ephemeral: true }).catch((err) => client.err(err));

		await banUser.ban();

		await interaction.deferUpdate();
	},
};
