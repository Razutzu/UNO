class User {
	constructor(user, host, game) {
		this.user = user;
		this.game = game;

		this.host = host;
		this.ready = false;

		if (host) return;

		if (this.game.users.length == 1) {
			this.game.getKickButton().setDisabled(false);
			this.game.getBanButton().setDisabled(false);
			this.game.getLockButton().setDisabled(false);
			this.game.getCHostButton().setDisabled(false);
			this.game.getReadyButton().setDisabled(false);
		}

		this.game.users.push(this);

		if (this.game.isFull()) this.game.getJoinButton().setDisabled(true);

		if (this.game.controlPanelStatus == 1) this.game.updateUsersMenuOptions();

		this.game.embed.setDescription(`${user.username} joined the game!`);
		this.game.embed.setFields(this.game.usersToField());

		this.game.updateControlPanel(null, false, false);
		return this.game.updateMessage();
	}
	async readyButton() {
		// what happens when a player presses "Ready"
		this.ready = !this.ready;

		this.game.embed.setFields(this.game.usersToField());

		if (this.game.users.filter((u) => u.ready).length == this.game.users.length) return await this.game.start();

		return await this.game.updateMessage();
	}
	async leave(action) {
		// makes the user leave
		if (this.game.users.length == 1) return this.game.end("The game has ended because everyone left.");
		else {
			if (action == 1) this.game.embed.setDescription(`${this.user.username} has been kicked!`);
			else if (action == 2) this.game.embed.setDescription(`${this.user.username} has been banned!`);
			else this.game.embed.setDescription(`${this.user.username} left the game!`);
		}

		if (this.game.isFull()) this.game.getJoinButton().setDisabled(false);

		this.game.removeUser(this);

		if (this.host) this.game.users[0].host = true;

		if (this.game.users.length == 1) {
			this.game.getKickButton().setDisabled(true);
			this.game.getBanButton().setDisabled(true);
			this.game.getLockButton().setDisabled(true);
			this.game.getCHostButton().setDisabled(true);
			this.game.resetMenu();
			this.game.getReadyButton().setDisabled(true);
			if (this.game.locked) this.game.lock();
		}

		if (this.game.controlPanelStatus == 1) this.game.updateUsersMenuOptions();

		this.game.embed.setFields(this.game.usersToField());

		await this.game.updateControlPanel(null, false, this.host);
		return await this.game.updateMessage();
	}
	async ban() {
		// bans the user
		this.game.banned.push(this);

		if (this.game.banned.length == 1) this.game.getUnbanButton().setDisabled(false);

		return await this.leave(2);
	}
	async unban() {
		// unbans the user
		this.game.banned.splice(this.game.banned.indexOf(this), 1);

		if (this.game.banned.length == 0) {
			this.game.getUnbanButton().setDisabled(true);
			this.game.resetMenu();
		}

		this.game.embed.setDescription(`${this.user.username} has been unbanned!`);

		await this.game.updateControlPanel(null, false, false);
		return await this.game.updateMessage();
	}
	async makeHost() {
		// makes the user the host
		const currentHost = this.game.getHost();

		currentHost.host = false;
		this.host = true;

		const userIndex = this.game.users.indexOf(this);

		this.game.users[0] = this;
		this.game.users[userIndex] = currentHost;

		this.game.resetMenu();
		this.game.embed.setDescription(`${this.user.username} is now the host!`);
		this.game.embed.setFields(this.game.usersToField());

		await this.game.updateControlPanel(null, false, true);
		return await this.game.updateMessage();
	}
}

export default User;
