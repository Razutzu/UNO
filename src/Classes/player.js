import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import cardSortOrder from "../JSON/colorSort.json" assert { type: "json" };
import client from "../client.js";

class Player {
	constructor(gameUser) {
		this.user = gameUser.user;
		this.game = gameUser.game;

		this.cards = [];

		this.status = 1;

		this.gamePanel = {
			message: null,
			embed: new EmbedBuilder().setColor(client.clr),
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId("draw").setStyle(ButtonStyle.Primary).setLabel("Draw").setDisabled(!gameUser.host),
					new ButtonBuilder().setCustomId("uno").setStyle(ButtonStyle.Danger).setLabel("Uno!").setDisabled(true)
				),
				new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("play").setDisabled(!gameUser.host)),
			],
			files: null,
		};
	}
	async updateGamePanel(interaction, request, disable) {
		// updates the player's game panel
		if (disable) {
			if (this.gamePanel.message)
				await this.controlPanel.message.interaction.editReply({ content: "The game panel has been disabled.", embeds: [], components: [], files: [] }).catch((err) => client.err(err));
			return (this.gamePanel.message = null);
		}
		if (request) {
			if (this.gamePanel.message)
				await this.gamePanel.message.interaction.editReply({ content: "You requested another game panel.", embeds: [], components: [], files: [] }).catch((err) => client.err(err));
			if (interaction)
				this.gamePanel.message = await interaction
					.reply({ embeds: [this.gamePanel.embed], components: this.gamePanel.components, files: this.gamePanel.files, ephemeral: true })
					.catch((err) => client.err(err));
		} else {
			if (this.gamePanel.message)
				this.gamePanel.message.interaction.editReply({ embeds: [this.gamePanel.embed], components: this.gamePanel.components, files: this.gamePanel.files }).catch(async (err) => {
					client.err(err);
					if (interaction)
						this.gamePanel.message = await interaction
							.reply({ embeds: [this.gamePanel.embed], components: this.gamePanel.components, files: this.gamePanel.files, ephemeral: true })
							.catch((err) => client.err(err));
				});
		}

		return this.gamePanel.message;
	}
	normalGamePanel() {
		this.gamePanel.embed = new EmbedBuilder().setColor(client.clr);
		this.gamePanel.components = [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("draw").setStyle(ButtonStyle.Primary).setLabel("Draw").setDisabled(true),
				new ButtonBuilder().setCustomId("uno").setStyle(ButtonStyle.Danger).setLabel("Uno!").setDisabled(true)
			),
			new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("play").setDisabled(true)),
		];
		this.gamePanel.files = [];
	}
	wildGamePanel(card) {
		this.setCardImage(card);
		this.gamePanel.embed.setAuthor({ name: "Choose a card " });
		this.gamePanel.components = [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("wild_b").setStyle(ButtonStyle.Secondary).setEmoji(`🟦`),
				new ButtonBuilder().setCustomId("wild_g").setStyle(ButtonStyle.Secondary).setEmoji(`🟩`),
				new ButtonBuilder().setCustomId("wild_r").setStyle(ButtonStyle.Secondary).setEmoji(`🟥`),
				new ButtonBuilder().setCustomId("wild_y").setStyle(ButtonStyle.Secondary).setEmoji(`🟨`)
			),
			new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("cancel").setStyle(ButtonStyle.Danger).setLabel("Cancel")),
		];
	}
	updateEmbedCards() {
		// updates the cards in the embed
		return this.gamePanel.embed.setDescription(this.cardsToString());
	}
	updateMenuCards() {
		// updates the cards in the menu
		if (!this.isTurn()) return this.gamePanel.components[1].components[0].setPlaceholder("Not your turn").setOptions(client.components.nothing).setDisabled(true);
		return this.gamePanel.components[1].components[0].setOptions(this.cardsToField());
	}
	getDrawButton() {
		// returns the draw button
		return this.gamePanel.components[0].components.find((b) => b.data.custom_id == "draw");
	}
	updateDrawButton() {
		// updates the draw button
		return this.getDrawButton().setDisabled(!this.isTurn());
	}

	///////////////////////////////////////////////////
	//                CARDS FUNCTIONS                //
	///////////////////////////////////////////////////

	async playCard(card) {
		// makes the player play a car
		// card.changeOwner(null);
		if ((this.status == 1 && card.value != "Wild") || (card.value == "Wild" && this.status == 2)) {
			this.removeCard(card);

			this.game.lastCard = card;
		}

		let nextPlayerWithSkip = null;

		switch (card.value) {
			case "Skip":
				nextPlayerWithSkip = this.game.getNextPlayerWithSkip();
				await this.game.changeTurn(
					nextPlayerWithSkip,
					`${this.user.username} plays a **${card.name}** and skips ${this.game.getNextPlayer().user.username}'s turn\n\nIt is ${nextPlayerWithSkip.user.username}'s turn`
				);
				break;
			case "Reverse":
				if (this.game.players.length == 2) {
					nextPlayerWithSkip = this.game.getNextPlayerWithSkip();
					await this.game.changeTurn(
						nextPlayerWithSkip,
						`${this.user.username} plays a **${card.name}** and skips ${this.game.getNextPlayer().user.username}'s turn\n\nIt is ${nextPlayerWithSkip.user.username}'s turn`
					);
				} else {
					this.game.reversed = !this.game.reversed;
					await this.game.changeTurn(nextPlayerWithSkip, `${this.user.username} plays a **${card.name}**\n\nIt is ${this.game.players[this.game.turn].user.username}'s turn`);
				}
				break;
			case "Two":
				const drawPlayer = this.game.getNextPlayer();
				nextPlayerWithSkip = this.game.getNextPlayerWithSkip();

				drawPlayer.addRandomCards(2);
				await this.game.changeTurn(
					nextPlayerWithSkip,
					`${this.user.username} plays a **${card.name}** and ${drawPlayer.user.username} draws 2 cards.\n\nIt is ${nextPlayerWithSkip.user.username}'s turn`
				);
				break;
			case "Wild":
				if (this.status == 2) {
					this.status = 1;
					this.normalGamePanel();

					await this.game.changeTurn(
						nextPlayerWithSkip,
						`${this.user.username} plays a **${card.value} card** and changes the color to ${card.color}\n\nIt is ${this.game.players[this.game.turn].user.username}'s turn`
					);
				} else {
					this.status = 2;
					this.wildGamePanel(card);
					await this.updateGamePanel(null, false, false);
				}
				break;
			case "Four":
				break;
			default:
				await this.game.changeTurn(nextPlayerWithSkip, `${this.user.username} plays a **${card.name}**\n\nIt is ${this.game.players[this.game.turn].user.username}'s turn`);
		}

		return this.cards;
	}
	isTurn() {
		// is it this player's turn?
		return this.game.players.indexOf(this) == this.game.turn;
	}
	setCardImage(card) {
		this.gamePanel.embed.setImage(card.attachment);
		this.gamePanel.files = [client.cards.get(card.name)];
	}
	removeCardImage() {
		this.gamePanel.embed.data.image = null;
		this.gamePanel.files = null;
	}
	getCard(cardId) {
		// returns a specific card from the hand
		return this.cards.find((c) => c.id == cardId);
	}
	addCard(card) {
		// adds a specific card to this player
		// card.changeOwner(this);

		this.cards.push(card);
		this.game.removeCard(card);

		return this.cards;
	}
	addRandomCards(amount) {
		// adds random cards to this users
		for (let i = 0; i < amount; i++) {
			const card = this.game.getRandomCard();
			// card.changeOwner(this);

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
			if (!value.find((c) => c.data.value == card.id)) value.push(new StringSelectMenuOptionBuilder().setLabel(card.name).setValue(card.id));

		if (value.length == 0) {
			this.gamePanel.components[1].components[0].setDisabled(true).setPlaceholder("No cards to play");
			value.push(client.components.nothing);
		} else this.gamePanel.components[1].components[0].setDisabled(false).setPlaceholder("Choose a card to play");

		return value;
	}
}

export default Player;
