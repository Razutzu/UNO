import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import cardSortOrder from "../JSON/colorSort.json" assert { type: "json" };
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
						.addOptions(this.cardsToField())
				),
			],
		};
	}
	async updateGamePanel(interaction, request, disable) {
		// updates the player's game panel
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
		// is it this player's turn?
		return this.game.players.indexOf(this) == this.game.turn;
	}
	addCard(card) {
		// adds a specific card to this player
	}
	addRandomCards(amount) {
		// adds random cards to this users
		for (let i = 0; i < amount; i++) {
			const card = this.game.getRandomCard();
			card.changeOwner(this);

			this.cards.push(card);
			this.game.removeCard(card);
		}

		return this.cards;
	}
	sortCards() {
		// sorts the card
		this.cards.sort((c1, c2) => {
			return cardSortOrder.color[c1.color] + cardSortOrder.value[c1.value] - (cardSortOrder.color[c2.color] + cardSortOrder.value[c2.value]);
		});

		for (const card of this.cards) {
			console.log(card.name);
		}
	}
	// am ramas aici
	cardsToString() {
		// returns a string with the cards
		return "ceva";
	}
	cardsToField() {
		// returns a field with the cards
	}
}

export default Player;
