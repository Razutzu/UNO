import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";

import client from "../client.js";
import User from "./user.js";
import Player from "./player.js";

class Game {
	constructor(interaction, maxPlayers) {
		this.id = interaction.channel.id;
		this.maxPlayers = maxPlayers;

		this.locked = false;

		this.users = [new User(interaction.user, true, this)];
		this.players = [];
		this.banned = [];

		this.controlPanelStatus = 0;

		this.turn = 0;

		// game starting data
		this.embed = null;
		this.components = null;
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

	lobby() {
		this.embed = new EmbedBuilder().setColor(client.clr).setDescription("Game embed").addFields(this.usersToField());
		this.components = [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("ready").setStyle(ButtonStyle.Success).setLabel("Ready"),
				new ButtonBuilder().setCustomId("join").setStyle(ButtonStyle.Primary).setLabel("Join"),
				new ButtonBuilder().setCustomId("leave").setStyle(ButtonStyle.Primary).setLabel("Leave")
			),
			new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("cpanel").setStyle(ButtonStyle.Danger).setLabel("Request Control Panel")),
		];
	}
	game() {
		this.embed = new EmbedBuilder().setColor(client.clr).setDescription("Game embed").addFields(this.playersToField());
		this.components = [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("gpanel").setStyle(ButtonStyle.Danger).setLabel("Request Game Panel"))];
	}
	async updateMessage() {
		// updates the game message when in lobby
		if (!this.message) this.message = await this.channel.send({ embeds: [this.embed], components: this.components }).catch((err) => client.err(err));
		else
			await this.message.edit({ embeds: [this.embed], components: this.components }).catch(async (err) => {
				client.err(er);
				this.message = await this.channel.send({ embeds: [this.embed], components: this.components }).catch((err) => client.err(err));
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

	///////////////////////////////////////////////////
	//                GAME FUNCTIONS                 //
	///////////////////////////////////////////////////

	async start() {
		for (const user of this.users) {
			user.ready = false;

			this.players.push(new Player(user));
		}

		this.game();

		await this.updateControlPanel(null, false, true);
		return await this.updateMessage();
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

	///////////////////////////////////////////////////
	//                USERS FUNCTIONS                //
	///////////////////////////////////////////////////

	// async join(user) {
	// 	// makes a user join the game
	// 	if (this.users.length == 1) {
	// 		this.getKickButton().setDisabled(false);
	// 		this.getBanButton().setDisabled(false);
	// 		this.getLockButton().setDisabled(false);
	// 		this.getCHostButton().setDisabled(false);
	// 	}

	// 	if (this.controlPanelStatus == 1) this.updateUsersMenuOptions();

	// 	this.users.push(new User(user, false, this));

	// 	this.embed.setFields(this.usersToField());

	// 	await this.updateControlPanel(null, false, false);
	// 	return await this.updateMessage();
	// }
	// async leave(gameUser) {
	// 	// makes a user leave the game
	// 	if (this.users.length == 1) return this.end();

	// 	this.removeUser(gameUser);

	// 	if (gameUser.host) this.users[0].host = true;

	// 	if (this.users.length == 1) {
	// 		this.getKickButton().setDisabled(true);
	// 		this.getBanButton().setDisabled(true);
	// 		this.getLockButton().setDisabled(true);
	// 		this.getCHostButton().setDisabled(true);
	// 		this.resetMenu();
	// 		if (this.locked) this.lock();
	// 	}

	// 	if (this.controlPanelStatus == 1) this.updateUsersMenuOptions();

	// 	this.embed.setFields(this.usersToField());

	// 	await this.updateControlPanel(null, false, gameUser.host);
	// 	return await this.updateMessage();
	// }
	// async unban(gameUser) {
	// 	// unbans a user
	// 	this.banned.splice(this.banned.indexOf(gameUser), 1);

	// 	if (this.banned.length == 0) {
	// 		this.getUnbanButton().setDisabled(true);
	// 		this.resetMenu();
	// 	}

	// 	await this.updateControlPanel(null, false, false);
	// 	return await this.updateMessage();
	// }
	// async ban(gameUser) {
	// 	// bans a user
	// 	this.banned.push(gameUser);

	// 	if (this.banned.length == 1) this.getUnbanButton().setDisabled(false);

	// 	return await this.leave(gameUser);
	// }
	// async makeHost(gameUser) {
	// 	// makes a user the host
	// 	const hostUser = this.getHost();

	// 	hostUser.host = false;
	// 	gameUser.host = true;

	// 	const gameUserIndex = this.users.indexOf(gameUser);

	// 	this.users[0] = gameUser;
	// 	this.users[gameUserIndex] = hostUser;

	// 	this.resetMenu();
	// 	this.embed.setFields(this.usersToField());

	// 	await this.updateControlPanel(null, false, true);
	// 	return await this.updateMessage();
	// }
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

	playersToField() {
		// return a field with all players (game)
		let value = "";

		for (const player of this.players) {
			if (player.isTurn()) value += `> **🎮 ${player.user.username} - ${player.cards.length}**\n`;
			else value += `> 🎮 ${player.user.username} - ${player.cards.length}\n`;
			console.log(1);
		}

		return {
			name: `Players (${this.players.length}${this.users.length > this.players.length ? ` + ${this.users.length - this.players.length}` : ""}/${this.maxPlayers})`,
			value,
		};
	}
}

export default Game;
