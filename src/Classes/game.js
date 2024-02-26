import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";

import cardToEmbedColors from "../JSON/cardToEmbedColors.json" assert { type: "json" };
import pack from "../JSON/pack.json" assert { type: "json" };
import client from "../client.js";

import Card from "./card.js";
import Player from "./player.js";
import User from "./user.js";

class Game {
	constructor(interaction, maxPlayers) {
		this.id = interaction.channel.id;
		this.maxPlayers = maxPlayers;

		this.locked = false;

		this.users = [new User(interaction.user, true, this)];
		this.players = [];
		this.banned = [];

		this.status = 0;
		this.controlPanelStatus = 0;

		this.turn = 0;
		this.nextTurn = 1;

		this.deck = [];
		this.lastCard = null;

		// game starting data
		this.embed = null;
		this.components = null;
		this.files = null;
		this.lobby();

		// control panel starting data
		this.controlPanel = {
			message: null,
			embed: new EmbedBuilder().setColor(client.clr).setDescription("Choose a button from below to manage the game"),
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId("kick").setStyle(ButtonStyle.Danger).setLabel("Kick").setDisabled(true),
					new ButtonBuilder().setCustomId("ban").setStyle(ButtonStyle.Danger).setLabel("Ban").setDisabled(true),
					new ButtonBuilder().setCustomId("unban").setStyle(ButtonStyle.Danger).setLabel("Unban").setDisabled(true),
					new ButtonBuilder().setCustomId("lock").setStyle(ButtonStyle.Danger).setLabel("Lock").setDisabled(true),
					new ButtonBuilder().setCustomId("chost").setStyle(ButtonStyle.Danger).setLabel("Change Host").setDisabled(true)
				),
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId("none")
						.setPlaceholder("Nothing to choose")
						.addOptions(new StringSelectMenuOptionBuilder().setLabel("None").setValue("None"))
						.setDisabled(true)
				),
			],
		};

		this.channel = interaction.channel;
		this.message = null;

		this.updateMessage();
	}

	///////////////////////////////////////////////////
	//               GENERAL FUNCTIONS               //
	///////////////////////////////////////////////////

	async updateMessage() {
		// updates the game message when in lobby
		if (!this.message) this.message = await this.channel.send({ embeds: [this.embed], components: this.components, files: this.files }).catch((err) => client.err(err));
		else
			await this.message.edit({ embeds: [this.embed], components: this.components, files: this.files }).catch(async (err) => {
				client.err(er);
				this.message = await this.channel.send({ embeds: [this.embed], components: this.components, files: this.files }).catch((err) => client.err(err));
			});

		return this.message;
	}
	async updateControlPanel(interaction, request, disable) {
		// updates the control panel
		if (disable) {
			if (this.controlPanel.message)
				await this.controlPanel.message.interaction.editReply({ content: "The control panel has been disabled.", embeds: [], components: [] }).catch((err) => client.err(err));
			return (this.controlPanel.message = null);
		}
		if (request) {
			if (this.controlPanel.message)
				await this.controlPanel.message.interaction.editReply({ content: "You requested another control panel.", embeds: [], components: [] }).catch((err) => client.err(err));
			if (interaction)
				this.controlPanel.message = await interaction.reply({ embeds: [this.controlPanel.embed], components: this.controlPanel.components, ephemeral: true }).catch((err) => client.err(err));
		} else {
			if (this.controlPanel.message)
				this.controlPanel.message.interaction.editReply({ embeds: [this.controlPanel.embed], components: this.controlPanel.components }).catch(async (err) => {
					client.err(err);
					if (interaction)
						this.controlPanel.message = await interaction
							.reply({ embeds: [this.controlPanel.embed], components: this.controlPanel.components, ephemeral: true })
							.catch((err) => client.err(err));
				});
		}

		return this.controlPanel.message;
	}
	lobby() {
		// lobby embed and components
		this.embed = new EmbedBuilder().setColor(client.clr).setDescription("Game embed").setFields(this.usersToField());
		this.components = [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("ready").setStyle(ButtonStyle.Success).setLabel("Ready").setDisabled(true),
				new ButtonBuilder().setCustomId("join").setStyle(ButtonStyle.Primary).setLabel("Join"),
				new ButtonBuilder().setCustomId("leave").setStyle(ButtonStyle.Primary).setLabel("Leave")
			),
			new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("cpanel").setStyle(ButtonStyle.Danger).setLabel("Control Panel")),
		];

		return this.embed;
	}
	game() {
		// game embed and components
		this.embed = new EmbedBuilder()
			.setColor(cardToEmbedColors[this.lastCard.color])
			.setDescription(
				`All the players received their cards.\nThe last card from the deck was flipped over: **${this.lastCard.name}**\n\nIt is ${this.players[this.turn].user.username}'s turn`
			)
			.setFields(this.playersToField());
		this.components = [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("gpanel").setStyle(ButtonStyle.Danger).setLabel("Game Panel"))];
		this.updateCardImage();

		return this.embed;
	}

	///////////////////////////////////////////////////
	//                GAME FUNCTIONS                 //
	///////////////////////////////////////////////////

	async start() {
		// starts the match
		this.status = 1;

		this.refillDeck();
		this.lastCard = this.getRandomCard();

		for (const user of this.users) {
			user.ready = false;

			const player = new Player(user);

			this.players.push(player);

			player.addRandomCards(7);
			player.addCard(this.getPlayableCard());
			player.sortCards();

			player.updateEmbedCards();
			player.updateMenuCards();
		}

		this.game();

		await this.updateControlPanel(null, false, true);
		return await this.updateMessage();
	}
	async changeTurn(nextPlayerWithSkip, message) {
		// changes the turn
		if (nextPlayerWithSkip) this.turn = this.players.indexOf(nextPlayerWithSkip);
		else this.turn = this.turn == this.players.length - 1 ? 0 : this.turn + 1;

		this.embed.setColor(cardToEmbedColors[this.lastCard.color]).setDescription(message).setFields(this.playersToField());
		this.updateCardImage();

		for (const player of this.players) {
			player.updateEmbedCards();
			player.updateMenuCards();
			player.updateDrawButton();
			player.gamePanel.embed.setColor(cardToEmbedColors[this.lastCard.color]);

			await player.updateGamePanel(null, false, false);
		}

		return await this.updateMessage();
	}
	updateCardImage() {
		// updates the card image
		this.embed.setThumbnail(this.lastCard.attachment);
		console.log(client.cards.get(this.lastCard.name));
		this.files = [client.cards.get(this.lastCard.name)];

		return this.embed;
	}
	hasStarted() {
		// has the game started?
		return this.status == 1 ? true : false;
	}

	///////////////////////////////////////////////////
	//                CARDS FUNCTIONS                //
	///////////////////////////////////////////////////

	refillDeck() {
		// reffils the deck
		for (const card of pack) this.deck.push(new Card(card, this));
		return this.deck;
	}
	removeCard(card) {
		// removes a card from the pack
		return this.deck.splice(this.deck.indexOf(card), 1);
	}
	getCard(cardId) {
		// returns a specific card from the pack
		return this.deck.find((c) => c.id == cardId);
	}
	getRandomCard() {
		// returns a random card from the pack
		return this.deck[Math.floor(Math.random() * this.deck.length)];
	}
	getPlayableCard() {
		// returns a playale card (testing function)
		const playableCards = this.deck.filter((c) => c.isPlayable() && c.value == "Wild");
		return playableCards[Math.floor(Math.random() * playableCards.length)];
	}

	///////////////////////////////////////////////////
	//                LOBBY FUNCTIONS                //
	///////////////////////////////////////////////////

	async end() {
		// deletes the game
		this.embed.setDescription("The game has ended because everyone left.").data.fields = [];
		this.components = [];
		client.games.delete(this.id);

		await this.updateControlPanel(null, false, true);
		return await this.updateMessage();
	}
	async lock() {
		// locks or unlocks the lobby
		this.locked = !this.locked;

		this.getLockButton().setLabel(this.locked ? "Unlock" : "Lock");
		this.getJoinButton().setDisabled(this.locked);

		this.embed.setFields(this.usersToField());

		await this.updateControlPanel(null, false, false);
		return await this.updateMessage();
	}
	resetMenu() {
		// transforms the control panel menu to the default one
		this.controlPanel.components[1].components[0]
			.setCustomId("none")
			.setPlaceholder("Nothing to choose")
			.setOptions(new StringSelectMenuOptionBuilder().setLabel("None").setValue("None"))
			.setDisabled(true);

		return (this.controlPanelStatus = 0);
	}
	kickMenu() {
		// transforms the control panel menu to kick options
		this.controlPanel.components[1].components[0].setCustomId("kickm").setPlaceholder("Choose the user to kick").setOptions(this.usersToOptions()).setDisabled(false);
		return (this.controlPanelStatus = 1);
	}
	banMenu() {
		// transforms the control panel menu to ban options
		this.controlPanel.components[1].components[0].setCustomId("banm").setPlaceholder("Choose the user to ban").setOptions(this.usersToOptions()).setDisabled(false);
		return (this.controlPanelStatus = 1);
	}
	unbanMenu() {
		// transforms the control panel menu to unban options
		this.controlPanel.components[1].components[0].setCustomId("unbanm").setPlaceholder("Choose the user to unban").setOptions(this.bannedToOptions()).setDisabled(false);
		return (this.controlPanelStatus = 2);
	}
	CHostMenu() {
		// transfroms the control panel to change host options
		this.controlPanel.components[1].components[0].setCustomId("chostm").setPlaceholder("Choose the user to make host").setOptions(this.usersToOptions()).setDisabled(false);
		return (this.controlPanelStatus = 1);
	}
	updateUsersMenuOptions() {
		// update the user options (ban/unban/kick/chost)
		return this.controlPanel.components[1].components[0].setOptions(this.type == 1 ? this.usersToOptions() : this.bannedToOptions());
	}
	getKickButton() {
		// returns the kick button (control panel)
		return this.controlPanel.components[0].components.find((c) => c.data.custom_id == "kick");
	}
	getBanButton() {
		// returns the ban button (control panel)
		return this.controlPanel.components[0].components.find((c) => c.data.custom_id == "ban");
	}
	getUnbanButton() {
		// returns the unban button (control panel)
		return this.controlPanel.components[0].components.find((c) => c.data.custom_id == "unban");
	}
	getLockButton() {
		// returns the lock button (control panel)
		return this.controlPanel.components[0].components.find((c) => c.data.custom_id == "lock");
	}
	getCHostButton() {
		// returns the change host button (control panel)
		return this.controlPanel.components[0].components.find((c) => c.data.custom_id == "chost");
	}
	getJoinButton() {
		// return the join button
		return this.components[0].components.find((c) => c.data.custom_id == "join");
	}
	getReadyButton() {
		// returns the ready button
		return this.components[0].components.find((c) => c.data.custom_id == "ready");
	}

	///////////////////////////////////////////////////
	//                USERS FUNCTIONS                //
	///////////////////////////////////////////////////

	getUser(id) {
		// returns a user
		return this.users.find((u) => u.user.id === id);
	}
	getBan(id) {
		// returns a banned user
		return this.banned.find((u) => u.user.id == id);
	}
	getHost() {
		// returns the host
		return this.users.find((u) => u.host);
	}
	removeUser(gameUser) {
		// removes a user from the game
		return this.users.splice(this.users.indexOf(gameUser), 1);
	}
	usersToOptions() {
		// returns a list of options of all users
		const options = [];

		for (const user of this.users.filter((u) => !u.host)) options.push(new StringSelectMenuOptionBuilder().setLabel(user.user.username).setValue(user.user.id));

		return options;
	}
	bannedToOptions() {
		// returns a field with all the banned users (lobby)
		const options = [];

		for (const ban of this.banned) options.push(new StringSelectMenuOptionBuilder().setLabel(ban.user.username).setValue(ban.user.id));

		return options;
	}
	usersToField() {
		// returns a field with all the users (lobby)
		let value = "";

		for (const user of this.users) {
			value += `> ${user.host ? "👑" : "👤"} ${user.user.username} - ${user.ready ? "✅" : "❌"}\n`;
		}

		return {
			name: `Players (${this.users.length}/${this.maxPlayers}) ${this.locked ? "🔒" : "🔓"}`,
			value,
		};
	}

	///////////////////////////////////////////////////
	//               PLAYERS FUNCTIONS               //
	///////////////////////////////////////////////////

	getPlayer(id) {
		// returns a player (game)
		return this.players.find((p) => p.user.id == id);
	}
	getNextPlayer() {
		return this.players[this.turn == this.players.length - 1 ? 0 : this.turn + 1];
	}
	getNextPlayerWithSkip() {
		return this.players[this.turn == this.players.length - 2 ? 0 : this.turn == this.players.length - 1 ? 1 : this.turn + 1];
	}
	removePlayer(player) {
		// removes a player (game)
		return this.players.splice(this.users.indexOf(player, 1));
	}
	playersToField() {
		// return a field with all players (game)
		let value = "";

		for (const player of this.players) {
			if (player.isTurn()) value += `> **🎮 ${player.user.username} - ${player.cards.length} cards**\n`;
			else value += `> 🎮 ${player.user.username} - ${player.cards.length} cards\n`;
		}

		return {
			name: `Players (${this.players.length}${this.users.length > this.players.length ? ` + ${this.users.length - this.players.length}` : ""}/${this.maxPlayers})`,
			value,
		};
	}
}

export default Game;
