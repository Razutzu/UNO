import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import client from "../client.js";

class Player {
	constructor(gameUser) {
		this.user = gameUser.user;
		this.game = gameUser.game;

		this.cards = [];

		this.gamePanel = {
			message: null,
			embed: new EmbedBuilder().setColor(client.clr).setDescription(this.cardsToString()),
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId("draw").setStyle(ButtonStyle.Primary).setLabel("Draw").setDisabled(!gameUser.host),
					new ButtonBuilder().setCustomId("uno").setStyle(ButtonStyle.Danger).setLabel("Uno!").setDisabled(true)
				),
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId("play")
						.setPlaceholder(gameUser.host ? "Choose a card to play" : "Not your turn")
						.setDisabled(!gameUser.host)
				),
			],
		};
	}
	async updateGamePanel(interaction, request, disable) {
		if (disable) {
			if (this.gamePanel.message)
				await this.controlPanel.message.interaction.editReply({ content: "The game panel has been disabled.", embeds: [], components: [] }).catch((err) => client.err(err));
			return (this.gamePanel.message = null);
		}
		if (request) {
			if (this.gamePanel.message)
				await this.gamePanel.message.interaction.editReply({ content: "You requested another game panel.", embeds: [], components: [] }).catch((err) => client.err(err));
			if (interaction)
				this.gamePanel.message = await interaction.reply({ embeds: [this.gamePanel.embed], components: this.gamePanel.components, ephemeral: true }).catch((err) => client.err(err));
		} else {
			if (this.gamePanel.message)
				this.gamePanel.message.interaction.editReply({ embeds: [this.gamePanel.embed], components: this.gamePanel.components }).catch(async (err) => {
					client.err(err);
					if (interaction)
						this.gamePanel.message = await interaction.reply({ embeds: [this.gamePanel.embed], components: this.gamePanel.components, ephemeral: true }).catch((err) => client.err(err));
				});
		}

		return this.gamePanel.message;
	}
	isTurn() {
		return this.game.players.indexOf(this) == this.game.turn ? true : false;
	}
	cardsToString() {
		return "ceva";
	}
}

export default Player;
