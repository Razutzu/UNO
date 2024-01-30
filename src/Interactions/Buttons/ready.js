import client from "../../client.js";

export default {
	run: async (interaction) => {
		const game = client.games.get(interaction.channel.id);
		if (!game) return await interaction.reply({ embeds: [client.embeds.noGame], ephemeral: true }).catch((err) => client.err(err));

		const user = game.getUser(interaction.user.id);
		if (!user) return await interaction.reply({ embeds: [client.embeds.notJoined], ephemeral: true }).catch((err) => client.err(err));

		if (game.hasStarted()) return await interaction.reply({ embeds: [client.embeds.cantUse], ephemeral: true }).catch((err) => client.err(err));

		if (game.users.length == 1) return await interaction.reply({ embeds: [client.embeds.oneMorePlayer], ephemeral: true }).catch((err) => client.err(err));

		await user.readyButton();

		await interaction.deferUpdate();
	},
};
