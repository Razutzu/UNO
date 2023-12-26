import client from "../../client.js";

export default {
	run: async (interaction) => {
		const game = client.games.get(interaction.channel.id);
		if (!game) return await interaction.reply({ embeds: [client.embeds.noGame], ephemeral: true }).catch((err) => client.err(err));

		if (game.getBan(interaction.user.id)) return await interaction.reply({ embeds: [client.embeds.banned], ephemeral: true }).catch((err) => client.err(err));

		if (game.getUser(interaction.user.id)) return await interaction.reply({ embeds: [client.embeds.alreadyJoined], ephemeral: true }).catch((err) => client.err(err));

		if (game.locked) return await interaction.reply({ embeds: [client.embeds.gameLocked], ephemeral: true }).catch((err) => client.err(er));

		await game.join(interaction.user);

		await interaction.deferUpdate();
	},
};
