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

		if (!player.isTurn()) return await interaction.reply({ embeds: [client.embeds.notYouTurn], ephemeral: true }).catch((err) => client.err(err));

		if (player.status != 2) return await interaction.reply({ embeds: [client.embeds.notWild], ephemeral: true }).catch((err) => client.err(err));

		if (player.preStatus == 1) {
			player.normalGamePanel();
			player.updateEmbedCards();
			player.updateMenuCards();
			player.updateDrawButton();
			player.updateUnoButton();
			player.setStatus(1);
		} else if (player.preStatus == 3) {
			player.drawGamePanel(player.getCard(interaction.customId.split("_").slice(1).join("_")));
			player.setStatus(3);
		}

		await player.updateGamePanel(null, false, false);

		return await interaction.deferUpdate();
	},
};
