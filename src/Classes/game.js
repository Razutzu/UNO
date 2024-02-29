import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, time } from "discord.js";

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
		this.reversed = false;

		this.users = [new User(interaction.user, true, this)];
		this.players = [];
		this.banned = [];

		this.mustCallUno = [];
		this.calledUno = null;

		this.status = 0;
		this.controlPanelStatus = 0;

		this.turn = 0;
		this.inactiveTurns = 0;

		this.deck = [];
		this.lastCard = null;

		// game starting data
		this.embed = null;
		this.components = null;
		this.files = null;
		this.lobby();

		this.inactivityTimeout = setTimeout(async () => {
			await this.end("The game has ended due to inactivity.");
		}, client.inactivityTimeoutTime);
		this.turnTimeout = null;

		// control panel starting data
		this.controlPanel = {
			message: null,
			embed: null,
			components: null,
		};

		this.channel = interaction.channel;
		this.message = null;

		this.resetControlPanel();
		this.updateMessage();
	}

	///////////////////////////////////////////////////
	//               GENERAL FUNCTIONS               //
	///////////////////////////////////////////////////

	async updateMessage() {
		// updates the game message when in lobby
		if (this.status == 0) {
			clearTimeout(this.inactivityTimeout);
			this.inactivityTimeout = setTimeout(async () => {
				await this.end("The game has ended due to inactivity.");
			}, client.inactivityTimeoutTime);
		}

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
	resetControlPanel() {
		// resets the control panel
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

		return this.controlPanel;
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

		clearTimeout(this.inactivityTimeout);
		this.inactivityTimeout = null;

		this.turnTimeout = setTimeout(async () => {
			this.inactiveTurns++;
			await this.players[this.turn].drawCard(true);
		}, client.turnTimeoutTime);

		this.refillDeck();
		this.lastCard = this.getRandomCard(true);

		for (const user of this.users) {
			user.ready = false;

			const player = new Player(user);

			this.players.push(player);

			player.addRandomCards(7); // de schimbat
			player.sortCards();

			player.updateEmbedCards();
			player.updateMenuCards();
			player.gamePanel.embed.setColor(cardToEmbedColors[this.lastCard.color]);
		}

		this.game();

		await this.updateControlPanel(null, false, true);
		return await this.updateMessage();
	}
	async stop(message) {
		// what happens when the match ends
		clearTimeout(this.turnTimeout);
		this.turnTimeout = null;

		this.inactivityTimeout = setTimeout(async () => {
			await this.end("The game has ended due to inactivity.");
		}, client.inactivityTimeoutTime);

		this.lobby(message);
		this.files = [];

		for (const player of this.players) await player.updateGamePanel(null, false, true);

		this.status = 0;
		this.inactiveTurns = 0;

		this.lastCard = null;
		this.deck = [];

		this.players = [];
		this.mustCallUno = [];
		this.calledUno = null;

		this.reversed = false;

		this.turn = 0;
		this.resetControlPanel();

		return await this.updateMessage(null, false, false);
	}
	async changeTurn(nextPlayerWithSkip, message, timeoutForce) {
		// changes the turn
		console.log(this.inactiveTurns);

		clearTimeout(this.turnTimeout);
		this.turnTimeout = setTimeout(async () => {
			this.inactiveTurns++;
			await this.players[this.turn].drawCard(true);
		}, client.turnTimeoutTime);

		if (!timeoutForce) this.inactiveTurns = 0;
		else if (this.inactiveTurns == 5) return await this.stop(`The game has stopped due to inactivity`);

		if (this.mustCallUno[0]) {
			if (this.mustCallUno[0].turns == 0) this.mustCallUno[0].turns++;
			else this.mustCallUno.shift();
		}

		if (nextPlayerWithSkip) this.turn = this.players.indexOf(nextPlayerWithSkip);
		else {
			if (this.reversed) this.turn = this.turn == 0 ? this.players.length - 1 : this.turn - 1;
			else this.turn = this.turn == this.players.length - 1 ? 0 : this.turn + 1;
		}

		this.embed
			.setColor(cardToEmbedColors[this.lastCard.color])
			.setDescription(`${message}${this.calledUno ? `\n\n${this.calledUno.user.username} calls UNO!` : ""}`)
			.setFields(this.playersToField());
		this.updateCardImage();

		this.calledUno = null;

		for (const player of this.players) {
			player.sortCards();
			player.updateEmbedCards();
			player.updateMenuCards();
			player.updateDrawButton();
			player.updateUnoButton();
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
	getRandomCard(lastCard) {
		// returns a random card from the pack
		if (lastCard) {
			const noWildDeck = this.deck.filter((c) => c.color != "Wild");

			return noWildDeck[Math.floor(Math.random() * noWildDeck.length)];
		}
		return this.deck[Math.floor(Math.random() * this.deck.length)];
	}
	getPlayableCard() {
		// returns a playale card (testing function)
		const playableCards = this.deck.filter((c) => c.isPlayable());
		return playableCards[Math.floor(Math.random() * playableCards.length)];
	}

	///////////////////////////////////////////////////
	//                LOBBY FUNCTIONS                //
	///////////////////////////////////////////////////
	lobby(message) {
		// lobby embed and components
		this.embed = new EmbedBuilder()
			.setColor(client.clr)
			.setDescription(
				`${
					message ? message : ""
				}\n\nIf you are the host of the game, press on 'Request Control Panel', so you can manage the game.\nIf you are not familiar with UNO, you can use the command /rules\nAnd that's it! Press on 'Ready' when you are ready and start playing!`
			)
			.setFields(this.usersToField());
		this.components = [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("ready")
					.setStyle(ButtonStyle.Success)
					.setLabel("Ready")
					.setDisabled(!(this.players.length > 1)),
				new ButtonBuilder().setCustomId("join").setStyle(ButtonStyle.Primary).setLabel("Join"),
				new ButtonBuilder().setCustomId("leave").setStyle(ButtonStyle.Primary).setLabel("Leave")
			),
			new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("cpanel").setStyle(ButtonStyle.Danger).setLabel("Control Panel")),
		];

		return this.embed;
	}
	async end(message) {
		// deletes the game
		this.embed.setDescription(message).data.fields = [];
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

	isFull() {
		// is the game full?
		return this.users.length == this.maxPlayers;
	}
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
		// next player without skip
		if (this.reversed) return this.players[this.turn == 0 ? this.players.length - 1 : this.turn - 1];
		return this.players[this.turn == this.players.length - 1 ? 0 : this.turn + 1];
	}
	getNextPlayerWithSkip() {
		// next player with skip
		if (this.reversed) return this.players[this.turn == 0 ? this.players.length - 2 : this.turn == 1 ? this.players.length - 1 : this.turn - 2];
		return this.players[this.turn == this.players.length - 2 ? 0 : this.turn == this.players.length - 1 ? 1 : this.turn + 2];
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
			name: `Players (${this.players.length}${this.users.length > this.players.length ? ` + ${this.users.length - this.players.length}` : ""}/${this.maxPlayers}) ${
				this.reversed ? "⬆️" : "⬇️"
			}`,
			value,
		};
	}
}

export default Game;
