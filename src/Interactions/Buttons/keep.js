import client from "../../client.js";

export default {
	run: async (interaction) => {
		const game = client.games.get(interaction.channel.id);
		if (!game) return await interaction.reply({ embeds: [client.embeds.noGame], ephemeral: true }).catch((err) => client.err(err));

		const user = game.getUser(interaction.user.id);
		if (!user) return await interaction.reply({ embeds: [client.embeds.notJoined], ephemeral: true }).catch((err) => client.err(err));

		if (!game.hasStarted()) return await interaction.reply({ embeds: [client.embeds.notStarted], ephemeral: true }).catch((err) => client.err(err));

		const player = game.getPlayer(interaction.user.id);
		if (!player) return await interaction.reply({ embeds: [client.embeds.notPlaying], ephemeral: true }).catch((err) => client.err(err));

		if (!player.isTurn()) return await interaction.reply({ embeds: [client.embeds.notYourTurn], ephemeral: true }).catch((err) => client.err(err));

		if (player.status != 3) return await interaction.reply({ embeds: [client.embeds.cantPlay], ephemeral: true }).catch((err) => client.err(err));

		player.setStatus(1);
		player.normalGamePanel();

		await player.keepCard();

		return await interaction.deferUpdate();
	},
};
