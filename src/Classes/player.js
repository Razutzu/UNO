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
			embed: new EmbedBuilder().setColor(client.clr),
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
						.addOptions(client.components.nothing)
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
	playCard(card) {
		card.changeOwner(null);
		this.removeCard(card);

		this.game.lastCard = card;
		this.game.updateCardImage();

		this.updateGamePanel(null, false, false);

		// am ramas aici
	}
	isTurn() {
		// is it this player's turn?
		return this.game.players.indexOf(this) == this.game.turn;
	}
	getCard(cardId) {
		// returns a specific card from the hand
		return this.cards.find((c) => c.id == cardId);
	}
	addCard(card) {
		// adds a specific card to this player
		card.changeOwner(this);

		this.cards.push(card);
		this.game.removeCard(card);

		return this.cards;
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
	removeCard(card) {
		// removes a card from the hand
		return this.cards.splice(this.cards.indexOf(card), 1);
	}
	sortCards() {
		// sorts the cards
		this.cards.sort((c1, c2) => {
			return cardSortOrder.color[c1.color] + cardSortOrder.value[c1.value] - (cardSortOrder.color[c2.color] + cardSortOrder.value[c2.value]);
		});

		return this.cards;
	}
	// am ramas aici
	cardsToString() {
		// returns a string with the cards
		let value = "";

		for (const card of this.cards) {
			if (card.isPlayable()) value += `**${card.name}** \n`;
			else value += `${card.name}\n`;
		}

		return value;
	}
	cardsToField() {
		// returns a field with the cards
		const value = [];

		for (const card of this.cards.filter((c) => c.isPlayable()))
			if (!value.find((c) => c.name == card.name)) value.push(new StringSelectMenuOptionBuilder().setLabel(card.name).setValue(card.id));

		if (value.length == 0) {
			this.gamePanel.components[1].components[0].setDisabled(true).setPlaceholder("No cards to play");
			value.push(client.components.nothing);
		} else if (this.gamePanel.components[1].components[0] && this.gamePanel.components[1].components[0].data.disabled) {
			this.gamePanel.components[1].components[0].setDisabled(false).setPlaceholder("Choose a card to play");
		}

		return value;
	}
}

export default Player;
