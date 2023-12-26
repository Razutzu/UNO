import client from "../client.js";

class User {
	constructor(user, host, game) {
		this.user = user;
		this.game = game;

		this.host = host;
		this.ready = false;

		// if (host) return;

		// if (this.game.users.length == 1) {
		// 	this.game.getKickButton().setDisabled(false);
		// 	this.game.getBanButton().setDisabled(false);
		// 	this.game.getLockButton().setDisabled(false);
		// 	this.game.getCHostButton().setDisabled(false);
		// }

		// if (this.game.controlPanelStatus == 1) this.game.updateUsersMenuOptions();

		// this.game.users.push(this);

		// this.game.embed.setFields(this.game.usersToField());

		// this.game.updateControlPanel(null, false, false);
		// return this.game.updateMessage();
	}
	async readyButton() {
		// what happens when a player presses "Ready"
		this.ready = !this.ready;

		this.game.embed.setFields(this.game.usersToField());

		return await this.game.updateMessage();
	}
	async leave() {
		// makes the user leave
		if (this.game.users.length == 1) return this.game.end();

		this.game.removeUser(this);

		if (this.host) this.game.users[0].host = true;

		if (this.game.users.length == 1) {
			this.game.getKickButton().setDisabled(true);
			this.game.getBanButton().setDisabled(true);
			this.game.getLockButton().setDisabled(true);
			this.game.getCHostButton().setDisabled(true);
			this.game.resetMenu();
			if (this.game.locked) this.game.lock();
		}

		if (this.game.controlPanelStatus == 1) this.game.updateUsersMenuOptions();

		this.game.embed.setFields(this.game.usersToField());

		await this.game.updateControlPanel(null, false, this.host);
		return await this.game.updateMessage();
	}
	async ban() {
		this.game.banned.push(this);

		if (this.game.banned.length == 1) this.game.getUnbanButton().setDisabled(false);

		return await this.leave();
	}
	async unban() {
		// unbans the user
		this.game.banned.splice(this.game.banned.indexOf(this), 1);

		if (this.game.banned.length == 0) {
			this.game.getUnbanButton().setDisabled(true);
			this.game.resetMenu();
		}

		await this.game.updateControlPanel(null, false, false);
		return await this.game.updateMessage();
	}
}

export default User;
