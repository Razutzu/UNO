import client from "../../client.js";

export default {
	run: async (interaction) => {
		const game = client.games.get(interaction.channel.id);
		if (!game) return await interaction.reply({ embeds: [client.embeds.noGame], ephemeral: true }).catch((err) => client.err(err));

		const user = game.getUser(interaction.user.id);
		if (!user) return await interaction.reply({ embeds: [client.embeds.notJoined], ephemeral: true }).catch((err) => client.err(err));

		if (!game.hasStarted()) return await interaction.reply({ embdes: [client.embeds.notStarted], ephemeral: true }).catch((err) => client.err(err));

		const player = game.getPlayer(interaction.user.id);
		if (!player) return await interaction.reply({ embeds: [client.embeds.notPlaying], ephemeral: true }).catch((err) => client.err(err));

		const card = player.getCard(interaction.values[0]);
		if (!card) return await interaction.reply({ embeds: [client.embeds.noCard], ephemeral: true }).catch((err) => client.err(err));

		await player.playCard(card);
		return await interaction.deferUpdate();
	},
};
