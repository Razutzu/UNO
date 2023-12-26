import client from "../client.js";

class User {
	constructor(user, host, game) {
		this.user = user;
		this.game = game;

		this.host = host;
		this.ready = false;
	}
	async readyButton() {
		// what happens when a player presses "Ready"
		this.ready = !this.ready;

		this.game.embed.setFields(this.game.usersToField());

		return await this.game.updateMessage();
	}
}

export default User;
